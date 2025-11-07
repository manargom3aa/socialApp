import type { Request, Response } from "express";
import { IConfirmEmailBodyInputsDTO, IForgotCodeBodyInputsDTO, IGmail, ILoginBodyInputsDTO, IResetForgotPasswordBodyInputsDTO, ISignupBodyInputsDTto, IUpdatePasswordBodyInputsDTO, IVerifyForgotPasswordBodyInputsDTO } from "./dto/auth.dto";

import {  successResponse } from "../../utils/response/success.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import {  ProviderEnum, UserModel } from "../../DB/models/user.model";
import { UserRepository } from "../../DB/repository";
import { BadRequest, ConflictException, NotFoundException } from "../../utils/response/error.response";
import { emailEvent } from "../../utils/events/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { ILoginResponse } from "./auth.entities";
import { EmailTemplateEnum } from "../../utils/events/email.tags";
 
// const otpGenerator = customAlphabet("0123456789", 6);

class AuthenticationService {
  
  private userModel = new UserRepository(UserModel);
  constructor() {

  }
   
  private async verifyGmailAccount(idToken: string) : Promise<TokenPayload>{
   const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID?.split(",") || [],  
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new BadRequest("Fail to verify this google account")
  }
  return payload;
  }

    // ------------------ Signup With Gmail ------------------
  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    
    const { idToken }: IGmail = req.body;
    const { email, family_name, given_name, picture } =
    await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter:{
        email,
      },
    })
    if (user) {
      if (user.provider === ProviderEnum.GOOGLE) {
        return await this.loginWithGmail(req,res)
      }
      throw new ConflictException(`Email exist with another provider :::${user.provider}`)
    }

    const [newUser] = await this.userModel.create({
      data:[{firstName:given_name as string, lastName:family_name as string, email:email as string, profileImage:picture as string , confirmedAt:new Date(), provider:ProviderEnum.GOOGLE}]
    }) || []

     if (!newUser){
     throw new BadRequest ("Fail to signup with gmail please try again later")
  }

  const credentials = await createLoginCredentials(newUser)


     return successResponse<ILoginResponse>({ res, data:{ credentials: { accessToken: credentials.access_token, refreshToken: credentials.refresh_token } }, statusCode:201 })

  }


      // ------------------ Login With Gmail ------------------
    loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    
    const { idToken }: IGmail = req.body;
    const { email } =
    await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter:{
        email,
        provider:ProviderEnum.SYSTEM,
      },
    })
    if (!user) {
      throw new NotFoundException(`Not Register account or registered with another provider`)
    }
  const credentials = await createLoginCredentials(user)
  return successResponse<ILoginResponse>({
    res,
    data: {
      credentials: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token
      }
    }
  })

  }
 



  // ------------------ SIGNUP ------------------

  signup = async (req: Request, res: Response): Promise<Response> => {
    let { userName, email, password }: ISignupBodyInputsDTto = req.body;

    const existingUser = await this.userModel.findOne({ 
      filter: { email },
      select: "email",
      options: {
        lean: true,
      },
    });
    
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }
    
    const otp = generateNumberOtp();
    const user = await this.userModel.createUser({
      data: [{
        userName, 
        email,
        password, 
        confirmEmailOtp: `${otp}` 
      }]
    });

     
    emailEvent.sendEmail(EmailTemplateEnum.CONFIRM_EMAIL, {
      to: email,
      otp,
      userName,
      title: "Email Confirmation"
    });

    return successResponse({
      res,
      statusCode: 201,
      message: "User created. OTP sent to email",
      data: { email: user.email, userName: user.userName },
    });
  };

 

  // ------------------ CONFIRM EMAIL ------------------
  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
   
    const { email, otp } : IConfirmEmailBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({ 
      filter:{
        email,
        confirmEmailOtp: { $exists: true},
        confirmedAt: { $exists: false},
      },
     });
    if (!user) throw new NotFoundException("User not found");
   
    if (!(await compareHash(otp, user.confirmEmailOtp as string))) {
      throw new ConflictException("In-valid confirmation code")
    }

    await this.userModel.updateOne({
      filter: { email },
      update:{
        confirmedAt: new Date(),
        $unset:{ confirmEmailOtp:1 },
      },
    })
    return successResponse({ res, message: "Email confirmed successfully" });
  }



  // ------------------ LOGIN ------------------
 login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password }: ILoginBodyInputsDTO = req.body;

  const user = await this.userModel.findOne({
    filter: { email },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (!user.confirmedAt) {
    throw new BadRequest("Please confirm your email first");
  }

  const isPasswordValid = await compareHash(password, user.password);
  if (!isPasswordValid) {
    throw new ConflictException("Invalid login credentials");
  }
  

  const credentials = await createLoginCredentials(user)
  return successResponse<ILoginResponse>({
    res,
    message: "Done",
    data: {
      credentials: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token
      }
    }
  })
};

//----------------------------------------------

sendForgotCode = async (req: Request, res: Response): Promise<Response> => {
  const { email }: IForgotCodeBodyInputsDTO = req.body;

  const user = await this.userModel.findOne({
    filter: { email ,provider:ProviderEnum.SYSTEM, confirmedAt:{ $exists: true}},
  });

  if (!user) {
    throw new NotFoundException("invalid account");
  }

  const otp = generateNumberOtp();
  const result = await this.userModel.updateOne({
    filter: { email },
    update:{
      resetPasswordOtp: await generateHash(String(otp)),
    },
  });

  if (!result.matchedCount) {
    throw new BadRequest("Fail to send the reset code please try again later")
  }
emailEvent.emit("resetPassword", { to:email,otp })
return res.json({
  message: "Done"
})
};

verifyForgotPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email ,otp }: IVerifyForgotPasswordBodyInputsDTO = req.body;

  const user = await this.userModel.findOne({
    filter: { email ,provider:ProviderEnum.SYSTEM, resetPasswordOtp:{ $exists: true}},
  });

  if (!user) {
    throw new NotFoundException("invalid account");
  }

   if (!await compareHash(otp , user.resetPasswordOtp as string)) {
    throw new ConflictException("invalid otp");
  }
return res.json({
  message: "Done"
})
};


resetForgotPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email ,otp ,password}: IResetForgotPasswordBodyInputsDTO = req.body;

  const user = await this.userModel.findOne({
    filter: { email ,provider:ProviderEnum.SYSTEM, resetPasswordOtp:{ $exists: true}},
  });

  if (!user) {
    throw new NotFoundException("invalid account");
  }

   if (!await compareHash(otp , user.resetPasswordOtp as string)) {
    throw new ConflictException("invalid otp");
  }

    const result = await this.userModel.updateOne({
    filter: { email },
    update:{
      password:await generateHash(password),
      changeCredentialsTime: new Date(),
      $unset: { resetPasswordOtp : 1 },
    },
  });
    if (!result.matchedCount) {
    throw new BadRequest("Fail to send the reset account password please try again later")
  }
  
return res.json({
  message: "Done"
})
};


updatePassword = async (req: Request, res: Response): Promise<Response> => {
  const { currentPassword, newPassword }: IUpdatePasswordBodyInputsDTO = req.body;
  const userId = (req as any).user._id;  

  const user = await this.userModel.findOne({
    filter: { _id: userId, provider: ProviderEnum.SYSTEM },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const isCurrentPasswordValid = await compareHash(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ConflictException("Current password is incorrect");
  }

  const isSamePassword = await compareHash(newPassword, user.password);
  if (isSamePassword) {
    throw new ConflictException("New password must be different from current password");
  }

 
  const result = await this.userModel.updateOne({
    filter: { _id: userId },
    update: {
      password: await generateHash(newPassword),
      changeCredentialsTime: new Date(),
    },
  });

  if (!result.matchedCount) {
    throw new BadRequest("Failed to update password");
  }

  return successResponse({
    res,
    message: "Password updated successfully",
  });
};
}

export default new AuthenticationService();

import { Response , Request} from "express";
import { IDisable2FADto, IEnable2FADto, ILogoutDto,   ISend2FACodeDto, IUpdateBasicInfoDto, IUpdateEmailDto, IVerify2FADto } from "./user.dto";
import { UserRepository } from "../../DB/repository/user.repository";
import { GenderEnum, HUserDocument,  RoleEnum, UserModel } from "../../DB/models/user.model";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { createPreSignedUploadLink, deleteFiles,   uploadFiles  } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { JwtPayload } from "jsonwebtoken";
import { BadRequest, ConflictException , NotFoundException } from "../../utils/response/error.response";
import { s3Events } from "../../utils/multer/s3.events";
import { successResponse } from "../../utils/response/success.response";
import { IProfileResponse, IUserResponse } from "./userentities";
import { ILoginResponse } from "../auth/auth.entities";
import { Types } from "mongoose";
import { ChatRepository, FriendRequestRepository, PostRepository } from "../../DB/repository";
import { ChatModel, FriendRequestModel, PostModel } from "../../DB/models";
import { GraphQLError } from "graphql";
import { emailEvent } from "../../utils/events/email.event";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateNumberOtp } from "../../utils/otp";
import { TwoFactorAuthEnum } from "../../DB/models/user.model";

interface IUser {
  id:number;
  name:string;
  email:string;
  gender: GenderEnum;
  password:string;
  followers:number[];
}

let users: IUser[] =[
  {
    id:1,
    name:"manar",
    email:"jkk@gmail.com",
    gender:GenderEnum.female,
    password:"grrw4vf",
    followers: [],
  },
    {
    id:2,
    name:"mona",
    email:"jkdk@gmail.com",
    gender:GenderEnum.female,
    password:"grrw4dvf",
    followers: [],
  }
]


export class UserService {
    private userModel = new UserRepository(UserModel)
    private postModel = new PostRepository(PostModel)
    private friendRequestModel = new FriendRequestRepository(FriendRequestModel as any)
    private chatModel = new ChatRepository(ChatModel)
    
    constructor() {}

    profile = async (req: Request, res:Response): Promise<Response> => {
       const profile = await this.userModel.findById({
        id: req.user?._id as Types.ObjectId,
        options:{
          populate: [
            {
              path: "friends",
              select:"firstName lastName email gender profilePicture",
            },
          ],
        },
       });
       if (!profile) {
          throw new NotFoundException("fail to find user profile")
       }

       const groups = await this.chatModel.find({
        filter:{
              participants: { $in: req.user?._id as Types.ObjectId },
              group: { $exists: true },
        },
       })
      return successResponse<IUserResponse>({ res, data: { user:profile , groups } })
    }


    dashboard = async (req: Request, res:Response): Promise<Response> => {
      const results = await Promise.allSettled([
        this.userModel.find({ filter: {} }),
        this.postModel.find({ filter: {} })
      ])
      return successResponse({
          res, data: { results } 
        })
    }


     updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
  const data: IUpdateBasicInfoDto = req.body;

 
  const userId = req.user?._id;

  const user = await this.userModel.findOneAndUpdate({
    filter: { _id: userId },
    update: data,
    options: { new: true },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return successResponse<IUserResponse>({
    res,
    message: "Profile updated successfully",
    data: { user },
  });
};

   updateEmail = async (req: Request, res: Response): Promise<Response> => {
        const { newEmail, password }: IUpdateEmailDto = req.body;
        const userId = req.user?._id as Types.ObjectId;
        const currentEmail = req.user?.email;
 
        if (newEmail === currentEmail) {
            throw new ConflictException("New email must be different from current email");
        }

      
        const isPasswordValid = await compareHash(password, req.user?.password as string);
        if (!isPasswordValid) {
            throw new ConflictException("Invalid password");
        }

  
        const existingUser = await this.userModel.findOne({
            filter: { 
                email: newEmail,
                _id: { $ne: userId }
            }
        });

        if (existingUser) {
            throw new ConflictException("Email already exists");
        }

       
        const otp = generateNumberOtp();
        const hashedOtp = await generateHash(String(otp));

         
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                newEmail: newEmail,
                confirmEmailOtp: hashedOtp,
                confirmEmailOtpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 دقائق
            }
        });

        if (!result.matchedCount) {
            throw new BadRequest("Failed to initiate email update");
        }

       
        emailEvent.emit("confirmEmailUpdate", { 
            to: newEmail, 
            otp,
            currentEmail: currentEmail as string
        });

        return successResponse({
            res,
            message: "Verification code sent to your new email address",
            data: {
                email: newEmail,
                expiresIn: "10 minutes"
            }
        });
    }


    confirmEmailUpdate = async (req: Request, res: Response): Promise<Response> => {
        const { otp }: { otp: string } = req.body;
        const userId = req.user?._id as Types.ObjectId;

        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                newEmail: { $exists: true },
                confirmEmailOtp: { $exists: true },
                confirmEmailOtpExpires: { $gt: new Date() }
            }
        });

        if (!user) {
            throw new NotFoundException("Invalid or expired verification code");
        }

        
        const isOtpValid = await compareHash(otp, user.confirmEmailOtp as string);
        if (!isOtpValid) {
            throw new ConflictException("Invalid verification code");
        }
 
        const updateResult = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                email: user.newEmail,
                changeCredentialsTime: new Date(),  
                $unset: { 
                    newEmail: 1, 
                    confirmEmailOtp: 1, 
                    confirmEmailOtpExpires: 1 
                }
            }
        });

        if (!updateResult.matchedCount) {
            throw new BadRequest("Failed to update email");
        }

      
        emailEvent.emit("emailUpdated", { 
            to: user.email,  
            newEmail: user.newEmail as string
        });

     
        emailEvent.emit("emailUpdateConfirmed", { 
            to: user.newEmail as string
        });

        return successResponse({
            res,
            message: "Email updated successfully"
        });
    }


    changeRole = async (req: Request, res:Response): Promise<Response> => {
      const { userId } = req.params as unknown as { userId: Types.ObjectId }
      const {role}:{role:RoleEnum} = req.body
      const denyRoles:RoleEnum[]=[role ,RoleEnum.superAdmin]
      if (req.user?.role === RoleEnum.admin) {
        denyRoles.push(RoleEnum.admin)
      }
      const user = await this.userModel.findOneAndUpdate({ 
        filter: {
          _id: userId as Types.ObjectId,
          role:{$nin:denyRoles}
      },
      update:{
        role,
      },
    })

    if (!user) {
      throw new NotFoundException("fail to find matching result")
    }
    

      return successResponse({
          res
        })
    }

     enable2FA = async (req: Request, res: Response): Promise<Response> => {
        const { password }: IEnable2FADto = req.body;
        const userId = req.user?._id as Types.ObjectId;

        const isPasswordValid = await compareHash(password, req.user?.password as string);
        if (!isPasswordValid) {
            throw new ConflictException("Invalid password");
        }

        if (req.user?.twoFactorAuth !== TwoFactorAuthEnum.DISABLED) {
            throw new ConflictException("Two-factor authentication is already enabled");
        }

   
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                twoFactorAuth: TwoFactorAuthEnum.EMAIL,
                twoFactorAuthEnabledAt: new Date(),
                $unset: { 
                    twoFactorAuthDisabledAt: 1,
                    twoFactorAuthOtp: 1,
                    twoFactorAuthOtpExpires: 1
                }
            }
        });

        if (!result.matchedCount) {
            throw new BadRequest("Failed to enable two-factor authentication");
        }

        return successResponse({
            res,
            message: "Two-factor authentication enabled successfully"
        });
    }

    
    disable2FA = async (req: Request, res: Response): Promise<Response> => {
        const { password }: IDisable2FADto = req.body;
        const userId = req.user?._id as Types.ObjectId;

       
        const isPasswordValid = await compareHash(password, req.user?.password as string);
        if (!isPasswordValid) {
            throw new ConflictException("Invalid password");
        }
 
        if (req.user?.twoFactorAuth === TwoFactorAuthEnum.DISABLED) {
            throw new ConflictException("Two-factor authentication is already disabled");
        }

       
        const result = await this.userModel.updateOne({
            filter: { _id: userId },
            update: {
                twoFactorAuth: TwoFactorAuthEnum.DISABLED,
                twoFactorAuthDisabledAt: new Date(),
                $unset: { 
                    twoFactorAuthEnabledAt: 1,
                    twoFactorAuthOtp: 1,
                    twoFactorAuthOtpExpires: 1
                }
            }
        });

        if (!result.matchedCount) {
            throw new BadRequest("Failed to disable two-factor authentication");
        }

        return successResponse({
            res,
            message: "Two-factor authentication disabled successfully"
        });
    }

    
    send2FACode = async (req: Request, res: Response): Promise<Response> => {
        const { email }: ISend2FACodeDto = req.body;

        const user = await this.userModel.findOne({
            filter: { 
                email,
                twoFactorAuth: TwoFactorAuthEnum.EMAIL,
                confirmedAt: { $exists: true }
            }
        });

        if (!user) {
             
            return successResponse({
                res,
                message: "If your account exists and has 2FA enabled, a verification code has been sent"
            });
        }

      
        const otp = generateNumberOtp();
        
         
        const result = await this.userModel.updateOne({
            filter: { _id: user._id },
            update: {
                twoFactorAuthOtp: otp, 
                twoFactorAuthOtpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 دقائق
            }
        });

        if (!result.matchedCount) {
            throw new BadRequest("Failed to send verification code");
        }

        return successResponse({
            res,
            message: "Verification code sent to your email"
        });
    }

    verify2FA = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IVerify2FADto = req.body;

        const user = await this.userModel.findOne({
            filter: { 
                email,
                twoFactorAuth: TwoFactorAuthEnum.EMAIL,
                twoFactorAuthOtp: { $exists: true },
                twoFactorAuthOtpExpires: { $gt: new Date() }
            }
        });

        if (!user) {
            throw new NotFoundException("Invalid or expired verification code");
        }

      
        const isOtpValid = await compareHash(otp, user.twoFactorAuthOtp as string);
        if (!isOtpValid) {
            throw new ConflictException("Invalid verification code");
        }

      
        await this.userModel.updateOne({
            filter: { _id: user._id },
            update: {
                $unset: { 
                    twoFactorAuthOtp: 1, 
                    twoFactorAuthOtpExpires: 1 
                }
            }
        });

       
        const credentials = await createLoginCredentials(user);

        return successResponse({
            res,
            message: "Two-factor authentication verified successfully",
            data: {
                credentials: {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token
                },
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    twoFactorAuth: user.twoFactorAuth
                }
            }
        });
    }



    sendFriendRequest = async (req: Request, res:Response): Promise<Response> => {
      const { userId } = req.params as unknown as { userId: Types.ObjectId }
      const checkFriendRequestExist = await this.friendRequestModel.findOne({
        filter:{
          createdBy: { $in: [req.user?._id, userId]},
          sendTo: { $in: [req.user?._id, userId]},

        },
      })
      if (checkFriendRequestExist) {
        throw new ConflictException("Friend Request already exist")
      }

      const user = await this.userModel.findOne({ filter:{ _id: userId }});
      if (!user) {
        throw new NotFoundException("invalid recipient")
      }
      
      const [friendRequest] =(await this.friendRequestModel.create({
        data:[
          {
            createdBy: req.user?._id as Types.ObjectId,
            sendTo: userId,
          },
        ],
      })) || [];

      if (!friendRequest) {
        throw new BadRequest("something went wrong...!")
      }

      return successResponse({
          res,
          statusCode:201,
        })
    }

    acceptFriendRequest = async (req: Request, res:Response): Promise<Response> => {
      const { requestId } = req.params as unknown as { requestId: Types.ObjectId }
      const friendRequest = await this.friendRequestModel.findOneAndUpdate({
        filter:{
          _id:requestId,
          sendTo: req.user?._id,
          acceptedAt: { $exists: false },
        },
        update:{
          acceptedAt: new Date(),
        },
      })
      if (!friendRequest) {
        throw new NotFoundException("fail to find match result")
      }
      
      await Promise.all([
        await this.userModel.updateOne({
          filter:{ _id: friendRequest.createdBy },
          update: {
            $addToSet: { friends: friendRequest.sendTo },
          },
        }),

        await this.userModel.updateOne({
          filter:{ _id: friendRequest.sendTo },
          update: {
            $addToSet: { friends: friendRequest.createdBy },
          },
        })
      ])

      return successResponse({
          res,
        })
    }

     deleteFriendRequest = async (req: Request, res: Response): Promise<Response> => {
        const { requestId } = req.params as { requestId: string };

        const result = await this.friendRequestModel.deleteOne({
            filter: { _id: requestId },
        });

        if (!result.deletedCount) {
            throw new NotFoundException("Friend request not found");
        }

        return successResponse({
            res,
            statusCode: 200,
            message: "Friend request deleted successfully",
        });
    };

    unFriend = async (req: Request, res: Response): Promise<Response> => {
    const { friendId } = req.params as { friendId: string };
    const userId = req.user?._id;

    const userUpdate = await this.userModel.updateOne({
        filter: { _id: userId },
        update: { $pull: { friends: friendId } },
    });

    await this.userModel.updateOne({
        filter: { _id: friendId },
        update: { $pull: { friends: userId } },
    });

    return successResponse({
        res,
        statusCode: 200,
        message: "Unfriended successfully",
    });
};

  blockUser = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as { userId: string };
    const { reason } = req.body;

    const result = await this.userModel.updateOne({
      filter: { _id: userId },
      update: {
        $set: {
          blockedAt: new Date(),
          blockedBy: req.user?._id,
          blockReason: reason || "No reason provided"
        }
      }
    });

    if (!result.matchedCount) throw new NotFoundException("User not found");

    return successResponse({
      res,
      statusCode: 200,
      message: "User blocked successfully",
    });
  }



ProfileImage = async (req: Request, res:Response) => {
   const {
    ContentType,
    originalname, 
    
}: { ContentType: string, originalname: string} = req.body;
const {url, key} = await createPreSignedUploadLink({
  ContentType,
  originalname,
  path:`users/${req.decoded?._id}`,
})


const user = await this.userModel.findByIdAndUpdate({
    id: new Types.ObjectId(req.decoded?._id as string),
    update:{ 
      profileImage: key,
      tempProfileImage: req.user?.profileImage,
     },
})
if (!user) {
    throw new BadRequest("Fail to update profile image")
}
s3Events.emit("trackProfileImageUpload", {
  userId: req.decoded?._id,
  Key: key,
  oldKey: req.user?.profileImage,
  expiresIn: 300000, // 5 minutes
})

  return successResponse<IProfileResponse>({ res, data:{ url } })
}


ProfileCoverImage = async (req: Request, res:Response) => {
  const urls = await uploadFiles({
    storageApproach: StorageEnum.disk,
    files: req.files as Express.Multer.File[],    
    path:`users/${req.decoded?._id}/cover`,
  })

 const user = await this.userModel.findByIdAndUpdate({
     id: new Types.ObjectId(req.decoded?._id as string),
     update:{
      coverOfImages: urls,
     },
 })
  if (!user) {
      throw new BadRequest("Fail to update cover image")
  }
  if (req.user?.coverOfImages){
    await deleteFiles({ urls: req.user.coverOfImages })
  }

  return successResponse<IUserResponse>({ res, data:{ user } })
}
 

logout = async (req: Request, res:Response): Promise<Response> => {
        const {flag} : ILogoutDto = req.body;
        let statusCode : number =200;
        const update: UpdateQuery<IUser> = {}
        switch (flag) {
            case LogoutEnum.all:
                update.changeCredentialsTime = new Date()
                break;
        
            default:
                    await createRevokeToken(req.decoded as JwtPayload) 
                    statusCode=201
                break;
        }

        await this.userModel.updateOne({
            filter:{ _id: req.decoded?._id },
            update,
        })

        return res.status(statusCode).json({
            message: "Done",
      })
    }


refreshToken =async (req: Request, res: Response):Promise<Response> => {
        const rawCredentials = await createLoginCredentials(req.user as HUserDocument);
        await createRevokeToken(req.decoded as JwtPayload) 
        const credentials = {
            accessToken: rawCredentials.access_token,
            refreshToken: rawCredentials.refresh_token
        };
        return successResponse<ILoginResponse>({ res, data:{ credentials } , statusCode: 201 })
}
  

//GRAPHQL

welcome = (): string => {
  return "Welcome"
}

allUsers = async (
  args: { gender: GenderEnum },
  authUser: HUserDocument
): Promise<HUserDocument[]> => {
  return await this.userModel.find({
    filter: {
      _id: { $ne: authUser._id },
      gender: args.gender,
    },
  });
};



search = (args: { email: string }) => {
  const user = users.find((ele) => ele.email === args.email);
  if (!user) {
    throw new GraphQLError("fail to find matching result", {
      extensions: { statusCode: 404 },
    });
  }
  return user;
};


addFollower = (args: { friendId: number; myId: number }) => {
  users = users.map((ele: IUser): IUser => {
    if (ele.id === args.friendId) {
      ele.followers.push(args.myId);
    }
    return ele;
  });
  return users;
};
}

export default new UserService();

import { HydratedDocument, model, models, Schema  } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/events/email.event";

export enum GenderEnum{
  male = "male",
  female = "female"
}

export enum TwoFactorAuthEnum {
    DISABLED = 'disabled',
    EMAIL = 'email',
}

export enum ProviderEnum{
  GOOGLE = "GOOGLE",
  SYSTEM = "SYSTEM"
}

export enum RoleEnum{
  user = "user",
  admin = "admin",
  superAdmin= "super-admin"
}

export interface IUser  {
  
  firstName: string;
  lastName: string;
  userName?: string;
  slug: string;

  email: string;
  confirmEmailOtp?:string;
  confirmedAt?:Date;

  password: string;
  resetPasswordOtp?:string;
  changeCredentialsTime?:Date;

  phone?: string;
  address?:string;

  profileImage?:string;
  tempProfileImage?:string;

  coverOfImages?:string[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  freezedAt?: Date;
  freezedBy?:  Schema.Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Schema.Types.ObjectId;
  friends?: Schema.Types.ObjectId[];

  twoFactorAuth: TwoFactorAuthEnum;
  twoFactorAuthOtp?: string;
  twoFactorAuthOtpExpires?: Date;
  twoFactorAuthEnabledAt?: Date;
  twoFactorAuthDisabledAt?: Date;

  newEmail?: string;
  confirmEmailOtpExpires?: Date;

  updatedAt?: Date;
  createdAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, minLength: 2, maxLength: 25 },
    lastName: { type: String, minLength: 2, maxLength: 25 },
    slug: { type: String, minLength: 5, maxLength: 51 },
    email: { type: String, required: true, unique: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    
    password: { 
      type: String, 
      required: function() {
        return this.provider === ProviderEnum.GOOGLE ? false : true;
      } 
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },

    phone: { type: String },
    address: { type: String },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    coverOfImages: [String],
    
    freezedAt: { type: Date },
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.SYSTEM },

    twoFactorAuth: { 
      type: String, 
      enum: Object.values(TwoFactorAuthEnum), 
      default: TwoFactorAuthEnum.DISABLED 
    },
    twoFactorAuthOtp: { 
      type: String,
      select: false  
    },
    twoFactorAuthOtpExpires: { 
      type: Date,
      select: false
    },
    twoFactorAuthEnabledAt: { 
      type: Date 
    },
    twoFactorAuthDisabledAt: { 
      type: Date 
    },

    newEmail: { 
      type: String 
    },
    confirmEmailOtpExpires: { 
      type: Date 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, 
  }
);

userSchema 
  .virtual("username")
  .set(function(value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
  })
  .get(function() {
    return this.firstName + " " + this.lastName;
  });

userSchema.pre("save", async function(this: HUserDocument & { 
  wasNew: boolean, 
  confirmEmailPlainOtp?: string,
  twoFactorAuthPlainOtp?: string 
}, next) {
  this.wasNew = this.isNew;
  
  if (this.isModified("password")) {
    this.password = await generateHash(this.password);
  }
  
  if (this.isModified("confirmEmailOtp") && this.confirmEmailOtp) {
    this.confirmEmailOtp = await generateHash(this.confirmEmailOtp);
    this.confirmEmailPlainOtp = this.confirmEmailOtp;
  }
  
  if (this.isModified("twoFactorAuthOtp") && this.twoFactorAuthOtp) {
    this.twoFactorAuthOtp = await generateHash(this.twoFactorAuthOtp);
    this.twoFactorAuthPlainOtp = this.twoFactorAuthOtp;
  }
  
  next();
});  

userSchema.post("save", async function (doc, next) {
  const that = this as HUserDocument & { 
    wasNew: boolean; 
    confirmEmailPlainOtp?: string;
    twoFactorAuthPlainOtp?: string;
  };

  if (that.wasNew && that.confirmEmailPlainOtp) {
    emailEvent.emit("confirmEmail", {
      to: doc.email,
      otp: that.confirmEmailPlainOtp,
    });
  }

  if (that.twoFactorAuthPlainOtp && doc.twoFactorAuth === TwoFactorAuthEnum.EMAIL) {
    emailEvent.emit("send2FACode", {
      to: doc.email,
      otp: that.twoFactorAuthPlainOtp,
      userName: doc.userName || doc.firstName
    });
  }

  next();
});

userSchema.pre(["find", "findOne"], function(next) {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query, deletedAt: { $exists: true } });
  }
  next();
});

userSchema.index({ email: 1 });
userSchema.index({ twoFactorAuth: 1 });
userSchema.index({ twoFactorAuthOtpExpires: 1 }, { expireAfterSeconds: 0 });

export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
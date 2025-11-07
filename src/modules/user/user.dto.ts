import z from "zod";
import { 
    freezeAccount, 
    hardDelete, 
    logout, 
    restoreAccount, 
    updateBasicInfo, 
    updateEmail,
    enable2FA,
    disable2FA,
    verify2FA,
    send2FACode,
    confirmEmailUpdate
} from "./user.validation";



export type ILogoutDto = z.infer<typeof logout.body>;
export type IFreezeAccountDto = z.infer<typeof freezeAccount.params>;
export type IRestoreAccountDto = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccountDto = z.infer<typeof hardDelete.params>;
export type IUpdateBasicInfoDto = z.infer<typeof updateBasicInfo.body>;
export type IUpdateEmailDto = z.infer<typeof updateEmail.body>;
export type IConfirmEmailUpdateDto = z.infer<typeof confirmEmailUpdate.body>;
export type IEnable2FADto = z.infer<typeof enable2FA.body>;
export type IDisable2FADto = z.infer<typeof disable2FA.body>;
export type IVerify2FADto = z.infer<typeof verify2FA.body>;
export type ISend2FACodeDto = z.infer<typeof send2FACode.body>;
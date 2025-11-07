import { Router } from "express";
import { authentication, authorization} from "../../middleware/authentication.middleware";
import userService from "./user.service";
import * as validators  from "./user.validation";
import { validation } from "../../middleware/validation.middleware";
import { TokenEnum } from "../../utils/security/token.security";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";
import { endpoint } from "./user.authorization";
import { chatRouter } from "../chat";
const router = Router();
router.use("/:userId/chat", chatRouter)
router.get("/", authentication(),userService.profile )
router.get("/dashboard", authorization(endpoint.dashboard),userService.dashboard )
router.post("/:userId/send-friend-request", authentication(), validation(validators.sendFriendRequest), userService.sendFriendRequest)

router.patch("/accept-friend-request/:requestId", authentication(), validation(validators.acceptFriendRequest), userService.acceptFriendRequest)
router.delete(
  "/friend-request/:requestId",
  authentication(),
  userService.deleteFriendRequest
);

router.patch(
  "/unfriend/:friendId",
  authentication(),
  userService.unFriend
);

router.patch("/:userId/change-role", authorization(endpoint.dashboard),validation(validators.changeRole),userService.changeRole )
router.patch("/update-basic-info",
  authentication(),
  validation(validators.updateBasicInfo),
  userService.updateBasicInfo
);
router.patch("/update-email",
  authentication(),
  validation(validators.updateEmail),
  userService.updateEmail
);
router.patch("/confirm-email-update",
  authentication(),
  validation(validators.confirmEmailUpdate),
  userService.confirmEmailUpdate
);

router.patch("/enable-2fa",
  authentication(),
  validation(validators.enable2FA),
  userService.enable2FA
);

router.patch("/disable-2fa",
  authentication(),
  validation(validators.disable2FA),
  userService.disable2FA
);

router.patch("/verify-2fa",
  validation(validators.verify2FA),
  userService.verify2FA
);

router.post("/send-2fa-code",
  validation(validators.send2FACode),
  userService.send2FACode
);
router.post("/refresh-token", authentication(TokenEnum.refresh),userService.refreshToken )
router.patch("/profile-image",
  authentication(),
  cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).single("image"),
  userService.ProfileImage
);

router.patch(
  "/:userId/block",
  authentication(),
  validation(validators.blockUser),
  userService.blockUser
);
router.patch("/profile-cover-image",
  authentication(),
  cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("image", 2),
  userService.ProfileCoverImage
);
router.post("/logout", authentication(),validation(validators.logout),userService.logout )

export default router
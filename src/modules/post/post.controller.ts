import { postService } from "./post.service";
import * as validators from './post.validation'
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation  } from "../../utils/multer/cloud.multer";
import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import { commentRouter } from "../comment";


const router = Router();
router.use("/:postId/comment", commentRouter)


router.post(
  "/",
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  authentication(),
  validation(validators.createPost),
  postService.createPost
);

router.get(
  "/:postId",
  authentication(),
  validation(validators.getPostById),
  postService.getPostById
);


router.patch(
  "/:postId",
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.updatePost),
  authentication(),
  postService.updatePost
);

router.patch(
  "/:postId/freeze",
  authentication(),
  validation(validators.freezePost),
  postService.freezePost
);

router.delete(
  "/:postId/hard-delete",
  authentication(),
  validation(validators.hardDeletePost),
  postService.hardDeletePost
);



router.patch("/:postId/like",authentication(),
cloudFileUpload({ validation: fileValidation.image}).array("attachments", 2),
postService.likePost
);
export default router
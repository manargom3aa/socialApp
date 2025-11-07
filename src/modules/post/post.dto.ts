import { z } from "zod";
 
import { likePost, freezePost, restorePost, hardDeletePost } from "./post.validation";


export type LikePostQueryDTO = z.infer<typeof likePost.query>;
export type FreezePostDTO = z.infer<typeof freezePost.body>;
export type RestorePostDTO = z.infer<typeof restorePost.params>;
export type HardDeletePostDTO = z.infer<typeof hardDeletePost.params>;
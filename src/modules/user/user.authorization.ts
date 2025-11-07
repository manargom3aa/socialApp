import { RoleEnum } from "../../DB/models/user.model";
 



export const endpoint ={
    welcome:[RoleEnum.user, RoleEnum.admin],
    profile:[RoleEnum.user ],
       dashboard:[RoleEnum.admin , RoleEnum.superAdmin],
    viewFreezedPosts: [RoleEnum.admin, RoleEnum.superAdmin],

}
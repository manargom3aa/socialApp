import { GraphQLError } from "graphql";
import { GenderEnum, HUserDocument, IUser } from "../../DB/models";
import { UserService } from "./user.service";
import { IAuthGraph } from "../graphql/schema.interface.gql";
 
export class UserResolver {
    private userService: UserService = new UserService()
    constructor() {}

    welcome = (parent: unknown, args: any): string =>{
        return this.userService.welcome()
    };

    allUsers = async(
        parent:unknown,
        args:{ gender: GenderEnum },
        context:IAuthGraph
    ): Promise<HUserDocument[]> =>{
        return await this.userService.allUsers(args, context.user)
    }


search = (args: { email: string }) => {
  const user = users.find((ele) => ele.email === args.email);
  if (!user) {
    throw new GraphQLError("fail to find matching result", {
      extensions: { statusCode: 404 },
    });
  }
  return {
    message: "User found successfully",
    statusCode: 200,
    data: user,
  };
};

    addFollower = (
        parent: unknown,
        args: { friendId: number; myId: number }
    ): IUser[] => {
        return this.userService.addFollower(args)
    }
}
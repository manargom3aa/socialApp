import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IComment as TDocument } from "../models/comment.model";


export class CommentRepository extends DatabaseRepository<TDocument>{
   constructor(protected override readonly model:Model<TDocument>){
    super(model)
   }
}
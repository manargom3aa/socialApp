import { CreateOptions, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";
import { DatabaseRepository, Lean } from "./database.repository";
import { IPost as TDocument } from "../models/post.model";
import { CommentRepository } from "./comment.repository";
import { CommentModel } from "../models";


export class PostRepository extends DatabaseRepository<TDocument>{
   private commentModel = new CommentRepository(CommentModel)
   
   constructor(protected override readonly model:Model<TDocument>){
      super(model)
   }

     async findCursor({
       filter,
       select,
       options,
     }: {
       filter?: RootFilterQuery<TDocument>;
       select?: ProjectionType<TDocument> | null;
       options?: QueryOptions<TDocument> | null;
     }): Promise<{ post: HydratedDocument<TDocument>, comments: any[] }[] | any> {
      let result = []
      const cursor = this.model.find(filter || {}).select(select || "").populate(options?.populate as PopulateOptions[]).cursor();
   
      for (let doc = await cursor.next(); doc != null;  doc=await cursor.next()){
         const comments = await this.commentModel.find({
            filter: { postId: doc._id, commentId: { $exists: false } },
         })
         result.push({ post: doc, comments })
      }
   
       return result;
     }


async paginate({
  filter = {},
  select = null,
  options = {},
  page = "all",
  size = 5,
}: {
  filter?: RootFilterQuery<TDocument>;
  select?: ProjectionType<TDocument> | null;
  options?: QueryOptions<TDocument> | null;
  page?: number | "all";
  size?: number;
}): Promise<HydratedDocument<TDocument>[] | [] | Lean<TDocument>[] | any> {
  let docsCount: number | undefined = undefined;
  let pages: number | undefined = undefined;

  if (page !== "all") {
    page = Math.floor(page < 1 ? 1 : page);

    if (!options) options = {}; 
    options.limit = Math.floor(size < 1 || !size ? 5 : size);
    options.skip = (page - 1) * options.limit;

    docsCount = await this.model.countDocuments(filter);
    pages = Math.ceil(docsCount / options.limit);
  }

  const result = await this.find({ filter, select, options });
  return {
    docsCount,
    limit: options.limit,
    pages,
    currentPage: page !== "all" ? page : undefined,
    result,
  };
}

async create({
   data,
   options,
}:{
   data: Partial<TDocument>[];
   options?: CreateOptions | undefined;
}): Promise<HydratedDocument<TDocument>[] | undefined>{
   return(await this.model.insertMany(data)) as HydratedDocument<TDocument>[];
}

async insertMany({
   data,
}:{
   data: Partial<TDocument>[];
}): Promise<HydratedDocument<TDocument>[]>{
   return (await this.model.insertMany(data)) as HydratedDocument<TDocument>[];
}
}
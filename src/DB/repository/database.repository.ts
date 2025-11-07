 
import { DeleteResult, FilterQuery } from "mongoose";
import { Types } from "mongoose";
import { MongooseUpdateQueryOptions, UpdateQuery, UpdateWriteOpResult } from "mongoose";
import { CreateOptions, FlattenMaps, HydratedDocument, Model,  PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";


export type Lean<T>= HydratedDocument<FlattenMaps<T>>
export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) {}

    async findOne ({
   
     filter ,
     select ,
     options,
   }:{
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;

   }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
       
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    };
    
    async findById ({
    
     id ,
     select ,
     options,
   }:{
    id?: Types.ObjectId;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;

   }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
       
        const doc = this.model.findOne(id).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.lean) {
            doc.lean();
        }
        return await doc.exec();
    };


  async find({
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<(HydratedDocument<TDocument> | Lean<TDocument>)[]> {
    const query = this.model.find(filter || {}).select(select || "");

    if (options?.populate) {
      query.populate(options.populate as PopulateOptions[]);
    }

    if (options?.lean) {
      query.lean(options.lean);
    }

    if (options?.skip) {
      query.skip(options.skip);
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.sort) {
      query.sort(options.sort);
    }

    return await query.exec();
  }
    async create({
        data,
        options,

    }: {
        data: Partial<TDocument>[];
        options?: CreateOptions | undefined;
    }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options);
    }

        async insertMany({
        data,
    }: {
        data: Partial<TDocument>[];
        
    }): Promise<HydratedDocument<TDocument>[]  > {
        return await this.model.insertMany(data ) as HydratedDocument<TDocument>[];
    }

async findOneAndUpdate({
  filter,
  update,
  options,
}: {
  filter: RootFilterQuery<TDocument>;
  update: UpdateQuery<TDocument>;
  options?: MongooseUpdateQueryOptions<TDocument> | null;
}): Promise<HydratedDocument<FlattenMaps<TDocument>> | null> {
  return await this.model.findOneAndUpdate(
    filter,
    { ...update, $inc: { __v: 1 } },
    { new: true, ...options }
  );
}

async findByIdAndUpdate({
  id,
  filter,
  update,
  options,
}: {
  id?: Types.ObjectId;
  filter?: FilterQuery<TDocument>;
  update: UpdateQuery<TDocument>;
  options?: MongooseUpdateQueryOptions<TDocument> | null;
}): Promise<HydratedDocument<FlattenMaps<TDocument>> | null> {
 
  const queryFilter = id ? { _id: id } : filter;
  if (!queryFilter) {
    throw new Error("Either 'id' or 'filter' must be provided");
  }

 
  return await this.model.findOneAndUpdate(
    { ...queryFilter },
    { ...update, $inc: { __v: 1 } },
    { ...(options || {}), new: true }
  );
}


    async findOneAndDelete({
    filter,
  }: {
    filter: RootFilterQuery<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return await this.model.findOneAndDelete(filter);
  }

    async updateOne({
    
      filter,
      update,
      options 
    }: {
        filter: RootFilterQuery<TDocument>;
        update: UpdateQuery<TDocument>;
        options?: MongooseUpdateQueryOptions<TDocument> | null;


    }):Promise<UpdateWriteOpResult>{
        return await this.model.updateOne(filter, { ...update, $inc: {__v:1}}, options)
    }

      async deleteOne({
    
      filter,
    }: {
        filter: RootFilterQuery<TDocument>;
    }):Promise<DeleteResult>{
        return this.model.deleteOne(filter)
    }
   
          async deleteMany({
    
      filter,
    }: {
        filter: RootFilterQuery<TDocument>;
    }):Promise<DeleteResult>{
        return this.model.deleteMany(filter)
    }
    
};
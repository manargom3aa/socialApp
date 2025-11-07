"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter, select, options, }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    ;
    async findById({ id, select, options, }) {
        const doc = this.model.findOne(id).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean();
        }
        return await doc.exec();
    }
    ;
    async find({ filter, select, options, }) {
        const query = this.model.find(filter || {}).select(select || "");
        if (options?.populate) {
            query.populate(options.populate);
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
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async insertMany({ data, }) {
        return await this.model.insertMany(data);
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, { new: true, ...options });
    }
    async findByIdAndUpdate({ id, filter, update, options, }) {
        const queryFilter = id ? { _id: id } : filter;
        if (!queryFilter) {
            throw new Error("Either 'id' or 'filter' must be provided");
        }
        return await this.model.findOneAndUpdate({ ...queryFilter }, { ...update, $inc: { __v: 1 } }, { ...(options || {}), new: true });
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async deleteOne({ filter, }) {
        return this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return this.model.deleteMany(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
;

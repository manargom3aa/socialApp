"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const database_repository_1 = require("./database.repository");
const comment_repository_1 = require("./comment.repository");
const models_1 = require("../models");
class PostRepository extends database_repository_1.DatabaseRepository {
    model;
    commentModel = new comment_repository_1.CommentRepository(models_1.CommentModel);
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findCursor({ filter, select, options, }) {
        let result = [];
        const cursor = this.model.find(filter || {}).select(select || "").populate(options?.populate).cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const comments = await this.commentModel.find({
                filter: { postId: doc._id, commentId: { $exists: false } },
            });
            result.push({ post: doc, comments });
        }
        return result;
    }
    async paginate({ filter = {}, select = null, options = {}, page = "all", size = 5, }) {
        let docsCount = undefined;
        let pages = undefined;
        if (page !== "all") {
            page = Math.floor(page < 1 ? 1 : page);
            if (!options)
                options = {};
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
    async create({ data, options, }) {
        return (await this.model.insertMany(data));
    }
    async insertMany({ data, }) {
        return (await this.model.insertMany(data));
    }
}
exports.PostRepository = PostRepository;

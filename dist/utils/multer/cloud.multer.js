"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.StorageEnum = void 0;
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const node_os_1 = __importDefault(require("node:os"));
const error_response_1 = require("../response/error.response");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["memory"] = "memory";
    StorageEnum["disk"] = "disk";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
exports.fileValidation = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
};
const cloudFileUpload = ({ validation = [], storageApproach = StorageEnum.memory, maxSizeMB = 2, }) => {
    const storage = storageApproach === StorageEnum.memory
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: node_os_1.default.tmpdir(),
            filename: function (req, file, callback) {
                callback(null, `${(0, uuid_1.v4)()}_${file.originalname}`);
            },
        });
    function fileFilter(req, file, callback) {
        if (!validation.includes(file.mimetype)) {
            return callback(new error_response_1.BadRequest("Validation error", {
                validationErrors: [
                    {
                        key: "file",
                        issue: [{ path: "file", message: "invalid file format" }],
                    },
                ],
            }));
        }
        return callback(null, true);
    }
    return (0, multer_1.default)({ storage, limits: { fieldSize: maxSizeMB * 1024 * 1024 }, fileFilter });
};
exports.cloudFileUpload = cloudFileUpload;

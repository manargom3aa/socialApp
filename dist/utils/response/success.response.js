"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, statusCode = 200, message = "Success", data, }) => {
    return res.status(statusCode).json({
        message,
        data,
    });
};
exports.successResponse = successResponse;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const InvalidPhotoTypeError_1 = require("../interfaces/errors/InvalidPhotoTypeError");
const utils_1 = require("../utils");
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new InvalidPhotoTypeError_1.InvalidPhotoTypeError(), false);
    }
};
const multerUpload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } //max 10MB
});
exports.upload = {
    array: (fieldName, maxCount) => {
        return (req, res, next) => {
            const multerMiddleware = multerUpload.array(fieldName, maxCount);
            multerMiddleware(req, res, (err) => {
                if (err instanceof multer_1.default.MulterError) {
                    if (err.code === "LIMIT_FILE_SIZE") {
                        return next(new utils_1.BadRequestError("File size exceeds 10MB limit"));
                    }
                    if (err.code === "LIMIT_FILE_COUNT") {
                        return next(new utils_1.BadRequestError(`Maximum ${maxCount} files allowed`));
                    }
                    if (err.code === "LIMIT_UNEXPECTED_FILE") {
                        return next(new utils_1.BadRequestError(`Unexpected field: ${err.field}`));
                    }
                    return next(new utils_1.BadRequestError(`Upload error: ${err.message}`));
                }
                if (err) {
                    return next(err);
                }
                next();
            });
        };
    }
};

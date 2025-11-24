import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { InvalidPhotoTypeError } from "../interfaces/errors/InvalidPhotoTypeError";
import { BadRequestError } from "../utils";

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new InvalidPhotoTypeError(), false);
  }
};

const multerUpload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } //max 10MB
});

export const upload = {
  array: (fieldName: string, maxCount: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
      
      const multerMiddleware = multerUpload.array(fieldName, maxCount);
      
      multerMiddleware(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(new BadRequestError("File size exceeds 10MB limit"));
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return next(new BadRequestError(`Maximum ${maxCount} files allowed`));
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(new BadRequestError(`Unexpected field: ${err.field}`));
          }
          
          return next(new BadRequestError(`Upload error: ${err.message}`));
        }
        
        if (err) {
          return next(err);
        }
        
        next();
      });
    };
  }
};
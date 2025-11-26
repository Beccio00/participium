import { CONFIG } from "../config/constants";
import * as OpenApiValidator from "express-openapi-validator";

export const ApiValidationMiddleware = OpenApiValidator.middleware({
    apiSpec: CONFIG.SWAGGER_FILE_PATH,
    validateRequests: true,
    validateResponses: true,
    validateSecurity: false,
    fileUploader: false,  
    ignorePaths: /\/api\/(reports|citizen)$/  
});
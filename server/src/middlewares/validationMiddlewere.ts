import { CONFIG } from "../config/constants";
import * as OpenApiValidator from "express-openapi-validator";

export const ApiValidationMiddleware = OpenApiValidator.middleware({
    apiSpec: CONFIG.SWAGGER_FILE_PATH,
    validateRequests: true,
    validateResponses: true,
    validateSecurity: false,
    fileUploader: false,  // Non gestire file upload - lascia fare a multer
    ignorePaths: /\/api\/reports$/  // Ignora POST e GET /api/reports
});
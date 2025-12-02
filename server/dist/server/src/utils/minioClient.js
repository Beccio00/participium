"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMinio = exports.BUCKET_NAME = void 0;
exports.getMinioObjectUrl = getMinioObjectUrl;
const Minio = __importStar(require("minio"));
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});
exports.BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'reports-photos';
const initMinio = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exists = yield minioClient.bucketExists(exports.BUCKET_NAME);
        if (!exists) {
            //if thereare some unknown client issue, we have to use us-east-1 region
            yield minioClient.makeBucket(exports.BUCKET_NAME, 'eu-south-1');
            console.log(`Bucket ${exports.BUCKET_NAME} created.`);
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${exports.BUCKET_NAME}/*`],
                    },
                ],
            };
            yield minioClient.setBucketPolicy(exports.BUCKET_NAME, JSON.stringify(policy));
        }
    }
    catch (err) {
        console.error('Error initializing MinIO:', err);
    }
});
exports.initMinio = initMinio;
exports.default = minioClient;
function getMinioObjectUrl(filename) {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    // Use a public endpoint if provided (host the browser can resolve), fallback to internal endpoint
    const host = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PUBLIC_PORT ? `:${process.env.MINIO_PUBLIC_PORT}` : (process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : '');
    return `${protocol}://${host}${port}/${exports.BUCKET_NAME}/${filename}`;
}

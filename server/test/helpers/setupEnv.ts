// 设置测试环境变量
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://participium:participium_password@localhost:5432/participium_test";
process.env.SESSION_SECRET = "test-secret";
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_ACCESS_KEY = "minioadmin";
process.env.MINIO_SECRET_KEY = "minioadmin";
process.env.MINIO_BUCKET_NAME = "test-reports-photos";
process.env.MINIO_USE_SSL = "false";
process.env.TYPEORM_SYNCHRONIZE = "true";


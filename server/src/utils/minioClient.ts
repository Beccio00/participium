import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'reports-photos';

export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
        //if thereare some unknown client issue, we have to use us-east-1 region
      await minioClient.makeBucket(BUCKET_NAME, 'eu-south-1');
      console.log(`Bucket ${BUCKET_NAME} created.`);
      
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (err) {
    console.error('Error initializing MinIO:', err);
  }
};

export default minioClient;
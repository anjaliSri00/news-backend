const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const checkS3Connection = async () => {
  try {
    await s3Client.send(new ListBucketsCommand({}));
    console.log("AWS S3 connected");
  } catch (error) {
    console.error("AWS S3 connection failed:", error);
    throw error;
  }
};

module.exports = { s3Client, checkS3Connection };

const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION;
const bucketName = process.env.S3_BUCKET_NAME;

function getClient() {
  if (!region || !bucketName) {
    throw new Error("AWS_REGION and S3_BUCKET_NAME are required.");
  }
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
  });
}

async function deleteImageFromS3(key) {
  if (!key) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

module.exports = { deleteImageFromS3 };

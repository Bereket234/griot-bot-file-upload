"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_VALUE,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function getSignedURL() {
  const session = true;
  if (!session) {
    return { failure: "not authenticated" };
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: "test-file",
  });

  const url = await getSignedUrl(
    s3Client,
    putObjectCommand,
    { expiresIn: 60 } // 60 seconds
  );
  console.log("Generated signed URL:", url);

  return { success: { url } };
}

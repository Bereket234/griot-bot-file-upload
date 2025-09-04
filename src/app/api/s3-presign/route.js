import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import File from "@/models/fileModel";
import mongoDBService from "@/lib/mongoDBService";

import crypto from "crypto";
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export async function POST(req) {
  try {
    const { fileName, fileType, fileSize, checksum } = await req.json();

    await mongoDBService();

    if (!fileName || !fileType || typeof fileSize !== "number" || !checksum) {
      return new Response(
        JSON.stringify({ failure: "Missing fileName, fileType, or fileSize" }),
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({
          failure:
            "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.",
        }),
        { status: 400 }
      );
    }

    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ failure: "File too large. Maximum size is 10MB." }),
        { status: 400 }
      );
    }

    const s3Client = new S3Client({
      region: process.env.AWS_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: generateFileName(),
      ContentType: fileType,
      ContentLength: fileSize,
      ContentType: fileType,
      ChecksumSHA256: checksum,
    });

    const url = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 60,
    });
    let file = null;

    if (url) {
      const fileLocation = url.split("?")[0];
      file = await File.create({
        fileName,
        fileType,
        fileSize,
        fileUrl: fileLocation,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    return new Response(JSON.stringify({ success: { url, file } }), {
      status: 200,
    });
  } catch (error) {
    console.log("issue creating file", error);
    return new Response(JSON.stringify({ failure: error.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  await mongoDBService();
  const files = await File.find();
  return new Response(JSON.stringify({ success: { files } }), { status: 200 });
}

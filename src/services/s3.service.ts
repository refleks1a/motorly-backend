import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Uploads a file buffer to AWS S3
 * @param folder - S3 folder prefix (e.g. 'vehicles' or 'chat-images')
 */
export async function uploadImageToS3(
  fileBuffer: Buffer,
  mimetype: string,
  originalName: string = 'image.jpg',
  folder: string = 'chat-images'
): Promise<string> {
  // Create S3 client inside the function to ensure process.env is fully loaded
  // and to throw error precisely when an upload is attempted if credentials are bad
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('S3 configuration is missing in environment variables. Please check AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME');
  }

  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

  const extension = path.extname(originalName) || '.jpg';
  const key = `${folder}/${uuidv4()}${extension}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype || 'image/jpeg',
  });
  
  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Failed to send S3 PutObjectCommand:', error);
    throw error;
  }
  
  // Construct and return the public URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

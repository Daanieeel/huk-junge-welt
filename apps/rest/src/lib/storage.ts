import { Client } from "minio";
import { env } from "@repo/env/server";

let _client: Client | null = null;
let _bucketReady = false;

function getClient(): Client {
  if (!_client) {
    _client = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return _client;
}

async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const client = getClient();
  const bucket = env.MINIO_BUCKET;

  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
    // Make bucket publicly readable
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });
    await client.setBucketPolicy(bucket, policy);
  }
  _bucketReady = true;
}

export async function uploadFile(params: {
  objectName: string;
  data: Buffer;
  contentType: string;
  size: number;
}): Promise<string> {
  await ensureBucket();
  const client = getClient();
  const { objectName, data, contentType, size } = params;

  await client.putObject(env.MINIO_BUCKET, objectName, data, size, {
    "Content-Type": contentType,
  });

  const protocol = env.MINIO_USE_SSL ? "https" : "http";
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET}/${objectName}`;
}

export async function deleteFile(objectName: string): Promise<void> {
  const client = getClient();
  await client.removeObject(env.MINIO_BUCKET, objectName);
}

export function objectNameFromUrl(url: string): string {
  const bucket = env.MINIO_BUCKET;
  const idx = url.indexOf(`/${bucket}/`);
  if (idx === -1) return url;
  return url.slice(idx + `/${bucket}/`.length);
}

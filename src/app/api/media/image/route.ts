import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

function getR2Client(): { client: S3Client; bucket: string } | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucket,
  };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return new NextResponse("Missing storage key parameter", { status: 400 });
  }

  const key = decodeURIComponent(rawKey).split("?")[0].replace(/^\/+/, "");

  // Prevent path traversal and enforce safe storage key characters
  if (
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\\") ||
    !/^[a-zA-Z0-9_\-./]+$/.test(key)
  ) {
    return new NextResponse("Invalid storage key format", { status: 400 });
  }

  const r2Config = getR2Client();
  if (!r2Config) {
    console.error("[Media Proxy] R2 credentials or configuration missing from environment variables.");
    return new NextResponse("Storage service unavailable", { status: 503 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: r2Config.bucket,
      Key: key,
    });

    const response = await r2Config.client.send(command);

    if (!response.Body) {
      return new NextResponse("Object not found in R2 storage", { status: 404 });
    }

    const contentType = response.ContentType || (key.endsWith(".png") ? "image/png" : "image/jpeg");
    const bodyBytes = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(bodyBytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Media Proxy] Failed to fetch image from R2 for key:", key, errMsg);
    return new NextResponse("Image not found", { status: 404 });
  }
}

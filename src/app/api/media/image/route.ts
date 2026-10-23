import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    "https://042c2a93d9bbcb294c87d69d053e7a6a.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID || "17ac6e89122dd689652c211529370079",
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY ||
      "f5d098257ba5e2d9ee20a4af139fad0b3e0b6cb318ca23fd8c3ab40cd9b3e851",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "ec-power-site-visit";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing storage key parameter", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

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
  } catch (err: any) {
    console.error("[Media Proxy] Failed to fetch image from R2 for key:", key, err?.message);
    return new NextResponse("Image not found", { status: 404 });
  }
}

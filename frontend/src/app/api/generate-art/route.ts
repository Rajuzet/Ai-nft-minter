import { NextResponse } from "next/server";
import crypto from "crypto";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

export async function POST(request: Request) {
  try {
    // 1. Verify Configuration
    if (!AWS_REGION || !S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: "AWS_REGION and S3_BUCKET_NAME must be configured on the server." },
        { status: 500 }
      );
    }

    // 2. Parse request payload
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt string is required." },
        { status: 400 }
      );
    }

    // 3. Initialize AWS Clients
    const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
    const s3Client = new S3Client({ region: AWS_REGION });

    // 4. Request image from Bedrock
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: prompt,
        imageGenerationConfig: {
          size: { width: 1024, height: 1024 },
          quality: "premium"
        }
      })
    });

    const result = await bedrockClient.send(command);
    const responseBody = new TextDecoder().decode(result.body);
    const payload = JSON.parse(responseBody);

    const imagePayload = payload?.outputs?.[0]?.content?.[0]?.image?.data
      || payload?.image
      || payload?.imageBase64
      || payload?.image_url;

    if (!imagePayload) {
      return NextResponse.json(
        { error: "No image data returned from Bedrock model." },
        { status: 502 }
      );
    }

    // 5. Build Image Buffer
    let imageBuffer: Buffer;
    if (typeof imagePayload === "string") {
      imageBuffer = Buffer.from(imagePayload, "base64");
    } else if (Array.isArray(imagePayload)) {
      imageBuffer = Buffer.from(imagePayload);
    } else {
      return NextResponse.json(
        { error: "Unsupported image payload format from Bedrock." },
        { status: 502 }
      );
    }

    // 6. Upload Image to S3
    const imageKey = `art/${Date.now()}-${crypto.randomUUID()}.png`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: "image/png",
      ACL: "public-read"
    }));

    const imageUrl = `${S3_PUBLIC_BASE_URL}/${imageKey}`;

    // 7. Assemble ERC-721 Metadata
    const metadata = {
      name: `AI Studio Collective Artwork #${Date.now()}`,
      description: "Institutional-grade AI-generated NFT art generated from a secure prompt.",
      image: imageUrl,
      attributes: [
        { trait_type: "Generation Engine", value: "amazon.titan-image-generator-v2:0" },
        { trait_type: "Prompt", value: prompt }
      ]
    };

    // 8. Upload Metadata to S3
    const metadataKey = `metadata/${Date.now()}-${crypto.randomUUID()}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(metadata),
      ContentType: "application/json",
      ACL: "public-read"
    }));

    const metadataUrl = `${S3_PUBLIC_BASE_URL}/${metadataKey}`;

    return NextResponse.json({ metadataUrl, imageUrl, metadata });
  } catch (error: any) {
    console.error("api/generate-art error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message || "Failed to generate art."}` },
      { status: 500 }
    );
  }
}

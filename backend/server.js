import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const AWS_REGION = process.env.AWS_REGION;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

if (!AWS_REGION || !S3_BUCKET_NAME) {
  throw new Error("AWS_REGION and S3_BUCKET_NAME must be configured in backend/.env");
}

const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

app.post("/api/generate-art", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A valid prompt string is required." });
    }

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
    const payload = JSON.parse(await streamToString(result.body));

    const imagePayload = payload?.outputs?.[0]?.content?.[0]?.image?.data
      || payload?.image
      || payload?.imageBase64
      || payload?.image_url;

    if (!imagePayload) {
      return res.status(502).json({ error: "No image data returned from Bedrock model." });
    }

    let imageBuffer;
    if (typeof imagePayload === "string") {
      imageBuffer = Buffer.from(imagePayload, "base64");
    } else if (Array.isArray(imagePayload)) {
      imageBuffer = Buffer.from(imagePayload);
    } else {
      return res.status(502).json({ error: "Unsupported image payload format." });
    }

    const imageKey = `art/${Date.now()}-${crypto.randomUUID()}.png`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: "image/png",
      ACL: "public-read"
    }));

    const imageUrl = `${S3_PUBLIC_BASE_URL}/${imageKey}`;
    const metadata = {
      name: `AI Studio Collective Artwork #${Date.now()}`,
      description: "Institutional-grade AI-generated NFT art generated from a secure prompt.",
      image: imageUrl,
      attributes: [
        { trait_type: "Generation Engine", value: "amazon.titan-image-generator-v2:0" },
        { trait_type: "Prompt", value: prompt }
      ]
    };

    const metadataKey = `metadata/${Date.now()}-${crypto.randomUUID()}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(metadata),
      ContentType: "application/json",
      ACL: "public-read"
    }));

    const metadataUrl = `${S3_PUBLIC_BASE_URL}/${metadataKey}`;
    return res.status(200).json({ metadataUrl, imageUrl, metadata });
  } catch (error) {
    console.error("generate-art error", error);
    return res.status(500).json({ error: "Failed to generate art and upload metadata." });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`AI NFT backend listening on port ${port}`);
});

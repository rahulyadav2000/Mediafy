import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

interface CLoudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  key: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unanthorised" }, { status: 401 });
    }

    if (
      !process.env.CLOUDINARY_API_KEY &&
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ) {
      return NextResponse.json(
        { error: "Cloudinary credentials not found" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CLoudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "video-uploads",
            transformation: [{ quality: "auto", fetch_format: "mp4" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as unknown as CLoudinaryUploadResult);
          },
        );
        uploadStream.end(buffer);
      },
    );

    const video = await prisma.video.create({
      data: {
        title,
        description,
        publicId: result.public_id,
        originalSize: originalSize,
        compressedSize: String(result.bytes),
        duration: String(result.duration),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.log("Upload video failed", error);
    return NextResponse.json({ error: "Upload video failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Custom API endpoint for file upload to imagekit

import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import {eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import {v4 as uuidv4} from "uuid";

// Initialize imagekit credentials
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""
});

export async function POST(request:NextRequest) {
    try {
        // check user
        const {userId} = await auth();
        if (!userId) {
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        //parse form data
        const formData = await request.formData()
        const file = formData.get("file") as File
        const formUserId = formData.get("userId") as string
        const parentId = formData.get("parentId") as string || null
        
        // check if formUserId is same as userId
        if (formUserId !== userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }
        
        // check if a file is there to upload or not
        if (!file){
            return NextResponse.json(
                {error: "No file provided"},
                {status: 401}
            );
        }

        if (parentId) {
            const [parentFolder] = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.id, parentId),
                        eq(files.userId, userId),
                        eq(files.isFolder, true)
                    )
                )
        } else {
            return NextResponse.json(
                {error: "Parent folder not found."},
                {status: 401}
            );
        }

        // supported file type for now: pdf, image
        if(!file.type.startsWith("image/") && file.type !== "application/pdf"){
            return NextResponse.json(
                {error: "Only images and pdf are supported at the moment."},
                {status: 401}
            );
        }

        // Convrt file to buffer
        const buffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)
        
        // generate file path
        const folderPath = parentId ? `/droply/${userId}/folder/${parentId}` : `/droply/${userId}`

        const originalFilename = file.name
        const fileExtension = originalFilename.split(".").pop() || ""

        //check for empty extension
        // validation for not storing exe, php or whatever we dont want
        const uniqueFilename = `${uuidv4()}.${fileExtension}`

        // Upload file to imagekit
        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: uniqueFilename,
            folder: folderPath,
            useUniqueFileName: false
        })

        const fileData = {
            name: originalFilename,
            path: uploadResponse.filePath,
            size: file.size,
            type: file.type,
            fileUrl: uploadResponse.url,
            thumbnailUrl: uploadResponse.thumbnailUrl,
            userId: userId,
            parentId: parentId,
            isFolder: false,
            isStarred: false,
            isTrash: false
        }

        const [newFile] = await db.insert(files).values(fileData).returning()

        return NextResponse.json(newFile);

    } catch (error) {
        return NextResponse.json(
                {error: "Failed to upload file."},
                {status: 401}
            );
    }
}
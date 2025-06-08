import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""
});

export async function PATCH(
    request: NextRequest,
    props: {params: Promise<{fileId: string}>}
) {
    try {
        const {userId} = await auth();
        if (!userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        const {fileId} = await props.params

        if (!fileId){
            return NextResponse.json(
                {error: "File ID is required."},
                {status: 400}
            );
        }

        const [file] = await db.select().from(files).where(
            and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            )
        )

        if (!file){
            return NextResponse.json(
                {error: "File not found."},
                {status: 401}
            );
        }

        if(!file.isFolder){
            try {
                let imagekitFileId = null;

                if (file.fileUrl) {
                    const urlWIthotQuery = file.fileUrl.split("?")[0];
                    imagekitFileId = urlWIthotQuery.split("/").pop();
                }

                if(!imagekitFileId && file.path) {
                    imagekitFileId = file.path.split("/").pop();
                }

                if (imagekitFileId) {
                    try {
                        const searchResults = await imagekit.listFiles({
                            name: imagekitFileId,
                            limit: 1,
                        });

                        if (searchResults && searchResults.length > 0) {
                            await imagekit.deleteFile(searchResults[0].fileId);
                        } else {
                            await imagekit.deleteFile(imagekitFileId);
                        }
                    } catch (searchError) {
                        console.error(`Error searching for file in Imagekit:`, searchError);
                        await imagekit.deleteFile(imagekitFileId);
                    }
                }
            } catch (error) {
                console.error(`Error deleting file ${fileId} from ImageKit:`, error);
            }
        }

        //toggle the delete status
        const [deletedFile] = await db.delete(files).where(
            and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            )
        ).returning();
        console.log("Files deleted: ", deletedFile);
        

        return NextResponse.json({
            success: true,
            message: "file deleted successfully",
            deletedFile,
        });
    } catch (error) {
        console.log("An error occured while deletion: ", error);
        return NextResponse.json(
            {error: "Failed to remove file."},
            {status: 500}
        );
    }
}
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request:NextRequest,
    props: {params: Promise <{fileId: string}>}
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
                {status: 401}
            );
        }

        const [file] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId)
                )
            );
            
        if (!file) {
            return NextResponse.json(
                {error: "File not found."},
                {status: 401}
            );
        }

        const updatedFiles = await db
            .delete(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId),
                    eq(files.isTrash, true)
                )
            ).returning();

        const updatedFile = updatedFiles[0]
        console.log("file removed from trash: ", updatedFile)

        return NextResponse.json(updatedFile);
    } catch (error) {
        console.error("Failed to trash file: ", error);
        return NextResponse.json(
            {error: "File couldn't be trashed"},
            {status: 401}
        );
    }
}
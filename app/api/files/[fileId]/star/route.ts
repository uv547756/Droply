import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request:NextRequest,
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

        // exactly same as [fileId]
         const {fileId} = await props.params

        if (!fileId){
            return NextResponse.json(
                {error: "File ID is required"},
                {status: 401}
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
                {error: "File not found"},
                {status: 401}
            );
        }

        //toggle the starred status
        const updatedFiles = await db.update(files).set({isStarred: true}).where(
            and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            )
        ).returning();

        console.log("File updated: ", updatedFiles);
        const updatedFile = updatedFiles[0]

        return NextResponse.json(updatedFile)

    } catch (error) {
        console.log("An error occured while updating file(s): ", error);
        return NextResponse.json(
            {error: "An error occured while deleting the file."},
            {status: 401}
        );
    }
    
}
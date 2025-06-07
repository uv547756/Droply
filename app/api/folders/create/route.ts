import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";

import {eq, and} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {v4 as uuidv4} from "uuid";

export async function POST(request: NextResponse) {
    try {
        const {userId} = await auth();
        if(!userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        const body = await request.json()
        const {name, userId: bodyUserId, parentId = null} = body

        if(bodyUserId != userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );        
        }

        if (!name || typeof name != "string" || name.trim()===""){
            return NextResponse.json(
                {error: "Folder name is required."},
                {status: 400}
            );
        }
        

        // if parentId is null, then its a root item, if not then in that case we check
        // if all 3 conditions be true:
            // 1. if the item in our db with id files.id has the same id as parentId or not
            // 2. if the userId assigned to that file in db, is same as userId at frontend
            // 3. if its even a folder or not :)
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
                if (!parentFolder){
                    return NextResponse.json(
                        {error: "Parent Folder not found."},
                        {status: 401}
                    )
                }
        }

        // create folder in db 
        // we use the schema defined at our db schema
        const folderData = {
            id: uuidv4(),
            name: name.trim(),
            path: `/folders/${userId}/${uuidv4()}`,
            size: 0,
            type: "folder",
            fileUrl: "",
            thumbnailUrl: null,
            userId,
            parentId,
            isFolder: true,
            isStarred: false,
            isTrash: false,
        };

        const [newFolder]= await db.insert(files).values(folderData).returning()

        return NextResponse.json({
            success: true,
            message: "Folder",
            folder: newFolder
        })

    } catch (error) {
        console.log("an error occurred while sending a req for folder creation", error);
    }
}
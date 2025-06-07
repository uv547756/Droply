import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const {userId} = await auth()
        if(!userId){
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        // ways the user might request a folder?

        // query params are like: ?name=komi&id=10
        const searchParams = request.nextUrl.searchParams
        const queryUserId = searchParams.get("userId")
        const parentId = searchParams.get("parentId")

        if (!queryUserId || queryUserId !== userId) {
            return NextResponse.json(
                {error: "Unauthorized"},
                {status: 401}
            );
        }

        //fetch files from db
        let userFiles;

        // fetch a specifc file based on parentId 
        if(parentId){
            //fetching from a specific folder
            userFiles = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.userId, userId),
                    eq(files.parentId, parentId)
                )
            )
        } else {
            //fetch root level files when its not inside a folder, i.e., parentId is null
            userFiles = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.userId, userId),
                        isNull(files.parentId)   
                    )
                )
        }
        
        return NextResponse.json(userFiles)
    } catch (error){
        return NextResponse.json(
            {error: "Error fetching files"},
            {status: 500}
        )     
    }
}
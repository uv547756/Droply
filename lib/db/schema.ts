import {pgTable, text, uuid, integer, boolean, timestamp} from "drizzle-orm/pg-core"
import {relations} from "drizzle-orm"

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  //basic file/folder information
  name: text("name").notNull(),
  path: text("path").notNull(), //  document/project/resume.pdf
  size: integer("size").notNull(),
  // Logic: is this a file or a folder?
  type: text("type").notNull(), //"folder"
  
  //storage information
  fileUrl: text("file_url").notNull(), //url to access file 
  thumbnailUrl: text("thumbnail_url"),

  //Ownership information
  userId: text("user_id").notNull(),
  parentId: uuid("parent_id"), // Parent folderId null for root items

  // file/folder flags 
  isFolder: boolean("is_folder").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isTrash: boolean("is_trash").default(false).notNull(),

  //Time stamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// reference: https://orm.drizzle.team/docs/relations
//
// parent: Each file/folder can have one parent folder
// children: Each folder can have many files/folder
export const filesRelations = relations(files, ({one, many}) => ({
  parent: one(files, {
    fields: [files.parentId], //foreign key
    references: [files.id]
  }),
  
  //relationship to child files/folder
  children: many(files) //many children inside 1 folder
}))


// Type definations
export const File = typeof files.$inferSelect
export const NewFile = typeof files.$inferInsert
// type File = {
// id: string;
// name: string;
// isFolder: boolean;
// and other inferred fields
// }



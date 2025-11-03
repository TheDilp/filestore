import { enum as enum_, int, object, string, union, uuidv4 } from "zod";

const FileTypesSchema = union([
  enum_([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "svg",
    "pdf",
    "doc",
    "docx",
    "txt",
    "xls",
    "xlsx",
    "mp3",
    "wav",
    "ogg",
    "mp4",
    "mov",
    "avi",
    "webm",
    "zip",
    "rar",
    "json",
    "csv",
  ]),
]);

export const FileSchema = object({
  id: uuidv4(),
  title: string(),
  createdAt: string(),
  deletedAt: string().nullable(),
  size: int(),
  type: FileTypesSchema,
  path: string(),
});

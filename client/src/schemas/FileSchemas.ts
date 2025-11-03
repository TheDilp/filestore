import { enum as enum_, int, object, string, union, uuidv4 } from "zod";

const FileTypesSchema = union([
  enum_([
    "Png",
    "Jpg",
    "Jpeg",
    "Webp",
    "Gif",
    "Svg",
    "Pdf",
    "Doc",
    "Docx",
    "Txt",
    "Xls",
    "Xlsx",
    "Mp3",
    "Wav",
    "Ogg",
    "Mp4",
    "Mov",
    "Avi",
    "Webm",
    "Zip",
    "Rar",
    "Json",
    "Csv",
  ]),
  string(),
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

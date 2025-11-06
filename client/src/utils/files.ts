const imageTypes = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);

const audioTypes = new Set(["mp3", "wav", "ogg", "aac", "m4p"]);

const videoTypes = new Set(["mp4", "webm", "ogg", "mov", "avi"]);

const textTypes = new Set(["txt", "csv", "json", "xml", "md"]);

const previewableTypes = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "mp3",
  "wav",
  "ogg",
  "aac",
  "m4p",
  "mp4",
  "webm",
  "ogg",
  "pdf",
  "txt",
  "csv",
  "json",
  "xml",
  "md",
  "mdx",
  "html",
  "yml",
  "sql",
]);

export function isImage(type: string): boolean {
  return imageTypes.has(type.toLowerCase());
}

export function isAudio(type: string): boolean {
  return audioTypes.has(type.toLowerCase());
}

export function isVideo(type: string): boolean {
  return videoTypes.has(type.toLowerCase());
}
export function isText(type: string): boolean {
  return textTypes.has(type.toLowerCase());
}
export function isPreviewable(type: string): boolean {
  return previewableTypes.has(type.toLowerCase());
}

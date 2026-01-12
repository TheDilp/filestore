const imageTypes = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);

const audioTypes = new Set(["mp3", "wav", "ogg", "aac", "m4p", "opus", "flac"]);

const videoTypes = new Set(["mp4", "webm", "ogg", "mov", "avi"]);

const textTypes = new Set(["txt", "csv", "json", "xml", "md"]);

const codeTypes = new Set([
  "js",
  "jsx",
  "json",
  "tsx",
  "ts",
  "css",
  "scss",
  "sass",
  "py",
  "rb",
  "php",
  "sh",
  "java",
  "cs",
  "html",
  "sql",
  "yml",
  "xml",
]);

const previewableTypes = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "opus",
  "flac",
  "gif",
  "svg",
  "mp3",
  "mp4",
  "webm",
  "ogg",
  "txt",
  "csv",
  "json",
  "xml",
  "md",
  "mdx",
  "html",
  "yml",
  "yaml",
  "sql",
  "js",
  "jsx",
  "tsx",
  "ts",
  "css",
  "scss",
  "sass",
  "py",
  "rb",
  "php",
  "sh",
  "java",
  "cs",
  "rs",
  "pdf",
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
export function isCode(type: string): boolean {
  return codeTypes.has(type.toLowerCase());
}

const codeLanguageMap: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  php: "php",
  sh: "bash",
  java: "java",
  cs: "csharp",
  html: "xml", //* highlight.js uses xml for HTML
  css: "css",
  scss: "scss",
  sass: "scss",
  yml: "yaml",
  yaml: "yaml",
  sql: "sql",
  json: "json",
  xml: "xml",
  md: "markdown",
  mdx: "markdown",
  dockerfile: "dockerfile",
  rs: "rust",
};

export function getHighlightLang(ext: string): string {
  return codeLanguageMap[ext.toLowerCase()] || "plaintext";
}

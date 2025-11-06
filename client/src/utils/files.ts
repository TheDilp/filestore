const imageTypes = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);

const audioTypes = new Set(["mp3", "wav", "ogg", "aac", "m4p"]);

export function isImage(type: string): boolean {
  return imageTypes.has(type.toLowerCase());
}

export function isAudio(type: string): boolean {
  return audioTypes.has(type.toLowerCase());
}

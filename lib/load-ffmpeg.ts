import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export const loadFFMPEG = async () => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
};

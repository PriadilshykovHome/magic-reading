/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_ID__: string;

declare module 'virtual:audio-manifest' {
  /** Audio files under public/audio, e.g. "sfx/sfx.mp3", "uk/voice/syl/ma.mp3". */
  const files: string[];
  export default files;
}

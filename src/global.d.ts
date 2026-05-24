/// <reference types="vite/client" />
// Fix for pdfjs-dist type error
declare global {
  type ImageDataArray = any;
}
export {};

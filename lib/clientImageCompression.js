const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_CONCURRENCY = 2;

function loadBrowserImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to read image: ${file.name}`));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function webpFilename(filename) {
  const base = String(filename || "property-image").replace(/\.[^.]+$/, "");
  return `${base}.webp`;
}

/**
 * Optimize one newly selected property image in the browser.
 *
 * Existing server images never pass through this function. If the browser
 * cannot decode/encode the file, or WebP is not smaller, the original File is
 * returned so the existing upload flow continues safely.
 */
export async function optimizePropertyImage(
  file,
  {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = {},
) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !(file instanceof File) ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  try {
    const image = await loadBrowserImage(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) return file;

    const scale = Math.min(
      1,
      maxWidth / sourceWidth,
      maxHeight / sourceHeight,
    );
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", quality);
    canvas.width = 1;
    canvas.height = 1;

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], webpFilename(file.name), {
      type: "image/webp",
      lastModified: file.lastModified || Date.now(),
    });
  } catch (error) {
    console.warn(`Image optimization skipped for ${file.name}:`, error);
    return file;
  }
}

/**
 * Preserve image order while limiting concurrent canvas work. Keeping the
 * concurrency low prevents large phone photos from freezing the admin tab.
 */
export async function optimizePropertyImages(
  files,
  { concurrency = DEFAULT_CONCURRENCY, ...options } = {},
) {
  const input = Array.from(files || []);
  if (input.length === 0) return [];

  const output = new Array(input.length);
  let nextIndex = 0;
  const workerCount = Math.min(
    input.length,
    Math.max(1, Number(concurrency) || DEFAULT_CONCURRENCY),
  );

  async function worker() {
    while (nextIndex < input.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await optimizePropertyImage(input[index], options);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return output;
}

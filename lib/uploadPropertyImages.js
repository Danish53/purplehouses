const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RETRIES = 2;
const UPLOAD_TIMEOUT_MS = 120000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uploadOnePropertyImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/properties/upload-image");
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // The status-based error below is more useful than a JSON parse error.
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.path) {
        onProgress(file.size);
        resolve(data.path);
        return;
      }

      reject(new Error(data?.error || `Image upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading image."));
    xhr.ontimeout = () => reject(new Error("Image upload timed out."));
    xhr.send(formData);
  });
}

async function uploadWithRetry(file, onProgress, retries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await uploadOnePropertyImage(file, onProgress);
    } catch (error) {
      lastError = error;
      onProgress(0);
      if (attempt < retries) await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

/**
 * Upload optimized property images independently with bounded concurrency.
 * A failed request is retried without resending images that already succeeded.
 */
export async function uploadPropertyImages(
  files,
  {
    concurrency = DEFAULT_CONCURRENCY,
    retries = DEFAULT_RETRIES,
    onProgress,
  } = {},
) {
  const input = Array.from(files || []);
  if (input.length === 0) return [];

  const paths = new Array(input.length);
  const loadedByFile = new Array(input.length).fill(0);
  const totalBytes = input.reduce((sum, file) => sum + file.size, 0);
  let nextIndex = 0;
  let uploadedCount = 0;

  const report = () => {
    const loadedBytes = loadedByFile.reduce((sum, size) => sum + size, 0);
    const percent = totalBytes
      ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
      : 100;
    onProgress?.({
      percent,
      uploaded: uploadedCount,
      total: input.length,
      loadedBytes,
      totalBytes,
    });
  };

  async function worker() {
    while (nextIndex < input.length) {
      const index = nextIndex;
      nextIndex += 1;
      const file = input[index];

      paths[index] = await uploadWithRetry(
        file,
        (loaded) => {
          loadedByFile[index] = Math.min(file.size, loaded);
          report();
        },
        retries,
      );
      loadedByFile[index] = file.size;
      uploadedCount += 1;
      report();
    }
  }

  const workerCount = Math.min(
    input.length,
    Math.max(1, Number(concurrency) || DEFAULT_CONCURRENCY),
  );
  report();
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return paths;
}

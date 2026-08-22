export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export async function fileToImagePart(
  file: File,
  maxSize = 1024
): Promise<ImagePart> {
  const dataUrl = await resizeImage(file, maxSize);
  const base64 = dataUrl.split(",")[1];

  return {
    inlineData: {
      mimeType: file.type || "image/jpeg",
      data: base64,
    },
  };
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));

        if (scale < 1) {
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas tidak didukung browser ini."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        const mime = file.type || "image/jpeg";
        const quality = 0.85;

        resolve(canvas.toDataURL(mime, quality));
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar."));
    };

    img.src = url;
  });
}
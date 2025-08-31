/**
 * Resizes and squares an image file to a maximum dimension,
 * placing it on a white background to maintain a 1:1 aspect ratio.
 * This is ideal for preparing images for avatar cropping.
 *
 * @param file The image file to process.
 * @param maxSize The maximum width and height for the output image.
 * @returns A promise that resolves with the data URL of the processed image.
 */
export function processImageForAvatar(
  file: File,
  maxSize: number = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        // Fill background with white (optional, good for transparent images)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, maxSize, maxSize);

        const aspect = img.width / img.height;
        let { width, height, x, y } = { width: 0, height: 0, x: 0, y: 0 };

        if (aspect > 1) {
          // Landscape
          width = maxSize;
          height = maxSize / aspect;
          x = 0;
          y = (maxSize - height) / 2;
        } else {
          // Portrait or square
          height = maxSize;
          width = maxSize * aspect;
          y = 0;
          x = (maxSize - width) / 2;
        }

        ctx.drawImage(img, x, y, width, height);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
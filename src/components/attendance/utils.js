export const compressImage = async (file, maxSizeKB = 40) => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        // ✅ Mirror the image horizontally
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;

        const tryCompress = () => {
          canvas.toBlob(blob => {
            if (!blob) return resolve(null);
            const sizeKB = blob.size / 1024;
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              resolve(new File([blob], file.name || 'image.jpg', { type: 'image/jpeg' }));
            } else {
              quality -= 0.1;
              setTimeout(() => tryCompress(), 0); // Prevent deep recursion
            }
          }, 'image/jpeg', quality);
        };

        tryCompress();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

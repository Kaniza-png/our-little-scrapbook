export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Perkecil dimensi secara proporsional jika lebar melebihi 1200px
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format WebP (atau JPEG jika browser tidak mendukung) kualitas 80%
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompres gambar."));
              return;
            }
            const extension = blob.type === "image/webp" ? "webp" : "jpg";
            const compressedFile = new File(
              [blob],
              `photo-${Date.now()}.${extension}`,
              { type: blob.type }
            );
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("File gambar tidak valid."));
    };

    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
  });
}
import { useEffect, useState } from "react";
import {
  Calendar,
  Heart,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// Kompresi foto otomatis di browser sebelum diunggah ke Supabase
function compressImage(file, maxWidth = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function AddMemoryModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  onOpenAddCategory,
}) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [story, setStory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && categories?.length > 0 && !categoryId) {
      setCategoryId(String(categories[0].id));
    }
  }, [isOpen, categories, categoryId]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  if (!isOpen) return null;

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removePhoto(indexToRemove) {
    URL.revokeObjectURL(previews[indexToRemove]);
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function resetAndClose() {
    if (saving) return;
    previews.forEach((url) => URL.revokeObjectURL(url));
    setTitle("");
    setEventDate("");
    setCategoryId(categories?.[0]?.id ? String(categories[0].id) : "");
    setLocationName("");
    setLocationUrl("");
    setStory("");
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMsg("");
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !eventDate || !story.trim()) {
      setErrorMsg("Judul kenangan, tanggal, dan cerita wajib diisi ya.");
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg("Pilih minimal 1 foto momen kalian terlebih dahulu.");
      return;
    }

    setSaving(true);

    try {
      const { data: newMemory, error: memError } = await supabase
        .from("memories")
        .insert([
          {
            title: title.trim(),
            event_date: eventDate,
            category_id: categoryId ? Number(categoryId) : null,
            location_name: locationName.trim() || null,
            location_url: locationUrl.trim() || null,
            story: story.trim(),
          },
        ])
        .select()
        .single();

      if (memError) throw memError;

      const uploadedPhotos = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const compressedBlob = await compressImage(file);
        const fileName = `${newMemory.id}/${Date.now()}_${i}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("memory-photos")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("memory-photos")
          .getPublicUrl(fileName);

        uploadedPhotos.push({
          memory_id: newMemory.id,
          photo_url: publicUrlData.publicUrl,
          display_order: i,
        });
      }

      const { error: photosError } = await supabase
        .from("memory_photos")
        .insert(uploadedPhotos);

      if (photosError) throw photosError;

      onSuccess?.();
      resetAndClose();
    } catch (err) {
      console.error("Gagal menyimpan kenangan:", err);
      setErrorMsg(
        err.message || "Terjadi kesalahan saat mengunggah foto & kenangan."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={resetAndClose}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto overflow-x-hidden overscroll-x-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Heart className="w-5 h-5 text-scrapbook-primary fill-current shrink-0" />
            <div className="min-w-0">
              <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
                Tambah Kenangan Baru
              </h2>
              <p className="text-[11px] text-scrapbook-text/70 mt-0.5">
                Abadikan cerita & foto momen spesial kalian
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={resetAndClose}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Judul */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Judul Kenangan *
            </label>
            <input
              type="text"
              placeholder="Misal: Makan Malam Pertama di Blok M"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="w-full h-11 px-3.5 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
            />
          </div>

          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Tanggal Kejadian *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-scrapbook-primary absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={saving}
                  className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-scrapbook-secondary bg-white text-scrapbook-text focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-scrapbook-text">
                  Kategori
                </label>
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={onOpenAddCategory}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-scrapbook-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Baru</span>
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={saving}
                className="w-full h-11 px-3 text-sm rounded-xl border border-scrapbook-secondary bg-white text-scrapbook-text focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Lokasi & Link Maps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Nama Tempat (Opsional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-scrapbook-primary absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Misal: Pantai Indah Kapuk"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={saving}
                  className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Link Google Maps (Opsional)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-scrapbook-primary absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  disabled={saving}
                  className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Foto Momen (Bisa pilih banyak sekaligus) *
            </label>

            <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-scrapbook-secondary bg-scrapbook-bg/40 hover:bg-scrapbook-bg cursor-pointer transition">
              <ImagePlus className="w-6 h-6 text-scrapbook-primary mb-1" />
              <span className="text-xs font-semibold text-scrapbook-text text-center">
                Klik untuk memilih foto dari galeri
              </span>
              <span className="text-[11px] text-scrapbook-text/60 mt-0.5 text-center">
                Otomatis dikompres agar hemat kuota & cepat dimuat
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={saving}
                className="hidden"
              />
            </label>

            {/* Pratinjau Foto Terpilih */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {previews.map((src, idx) => (
                  <div
                    key={src}
                    className="relative aspect-square rounded-xl overflow-hidden border border-scrapbook-secondary bg-pink-50"
                  >
                    <img
                      src={src}
                      alt={`Pratinjau ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/65 text-white hover:bg-red-600 transition"
                      title="Hapus foto ini"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cerita */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Cerita Momen Ini *
            </label>
            <textarea
              rows={4}
              placeholder="Ceritakan hal seru, lucu, atau berkesan di hari itu..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={saving}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40 resize-y"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-pink-100">
            <button
              type="button"
              disabled={saving}
              onClick={resetAndClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-scrapbook-text/70 hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Simpan Kenangan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
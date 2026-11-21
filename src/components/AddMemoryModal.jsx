import { useState } from "react";
import {
  Calendar,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { compressImage } from "../utils/compressImage";
import CategoryIcon from "./CategoryIcon";

export default function AddMemoryModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  onOpenAddCategory,
}) {
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [locationName, setLocationName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [story, setStory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  function resetForm() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setTitle("");
    setEventDate(today);
    setCategoryId(categories[0]?.id || "");
    setLocationName("");
    setLocationUrl("");
    setStory("");
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMsg("");
    setStatusText("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !story.trim() || !eventDate) {
      setErrorMsg("Judul, tanggal, dan cerita kenangan wajib diisi ya.");
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg("Pilih minimal 1 foto untuk kenangan ini.");
      return;
    }

    setSubmitting(true);

    try {
      setStatusText("Menyimpan cerita kenangan...");
      const activeCategoryId = categoryId || categories[0]?.id || null;

      const { data: newMemory, error: memError } = await supabase
        .from("memories")
        .insert([
          {
            title: title.trim(),
            story: story.trim(),
            event_date: eventDate,
            category_id: activeCategoryId,
            location_name: locationName.trim() || null,
            location_url: locationUrl.trim() || null,
          },
        ])
        .select()
        .single();

      if (memError) throw memError;

      const photoRows = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setStatusText(
          `Mengompres & mengunggah foto ${i + 1} dari ${selectedFiles.length}...`
        );
        const compressed = await compressImage(selectedFiles[i]);
        const ext = compressed.type === "image/webp" ? "webp" : "jpg";
        const filePath = `${newMemory.id}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-photos")
          .upload(filePath, compressed, {
            contentType: compressed.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("memory-photos")
          .getPublicUrl(filePath);

        photoRows.push({
          memory_id: newMemory.id,
          photo_url: publicUrlData.publicUrl,
          display_order: i,
        });
      }

      setStatusText("Menyusun album foto...");
      const { error: photosInsertError } = await supabase
        .from("memory_photos")
        .insert(photoRows);

      if (photosInsertError) throw photosInsertError;

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Gagal menambah kenangan:", err);
      setErrorMsg(
        err.message || "Terjadi kesalahan saat menyimpan kenangan. Coba lagi."
      );
    } finally {
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden my-8">
        {/* Header Modal */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div>
            <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
              Tulis Kenangan Baru
            </h2>
            <p className="text-xs text-scrapbook-text/70 mt-0.5">
              Abadikan momen manis kalian di halaman scrapbook
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 hover:text-scrapbook-text transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Upload Multi-Foto */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Foto Kenangan (Bisa pilih lebih dari 1 foto) *
            </label>

            <label className="flex flex-col items-center justify-center w-full py-5 px-4 border-2 border-dashed border-scrapbook-secondary rounded-xl bg-scrapbook-bg/50 hover:bg-scrapbook-bg cursor-pointer transition">
              <ImagePlus className="w-7 h-7 text-scrapbook-primary mb-1" />
              <span className="text-xs font-semibold text-scrapbook-text">
                Klik untuk memilih foto dari perangkat
              </span>
              <span className="text-[11px] text-scrapbook-text/60 mt-0.5">
                Otomatis dikompres agar ringan & hemat penyimpanan
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={submitting}
                className="hidden"
              />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                {previews.map((src, idx) => (
                  <div
                    key={src}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-pink-200 bg-pink-50"
                  >
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-scrapbook-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        Sampul
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      disabled={submitting}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Judul Kenangan */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Judul Kenangan *
            </label>
            <input
              type="text"
              placeholder="Misal: Makan Ramen Pertama Bareng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
            />
          </div>

          {/* Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Tanggal Kejadian *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-scrapbook-primary absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
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
                    disabled={submitting}
                    onClick={onOpenAddCategory}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-scrapbook-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Baru</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected =
                    String(categoryId || categories[0]?.id) === String(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => setCategoryId(cat.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isSelected
                          ? "bg-scrapbook-primary text-white border-scrapbook-primary shadow-sm"
                          : "bg-white text-scrapbook-text border-scrapbook-secondary hover:bg-scrapbook-bg"
                      }`}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-white" : "text-scrapbook-primary"
                        }`}
                      />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nama Tempat & Link Google Maps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Nama Tempat (Opsional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-scrapbook-primary absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Misal: Kebun Raya Bogor"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Tautan Google Maps (Opsional)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-scrapbook-primary absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Cerita Kenangan */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Cerita Momen Ini *
            </label>
            <textarea
              rows={3}
              placeholder="Ceritakan hal seru, lucu, atau berkesan yang terjadi hari itu..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-pink-100">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-scrapbook-text/70 hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-60 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusText || "Menyimpan..."}</span>
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
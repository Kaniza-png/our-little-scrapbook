import { useEffect, useState } from "react";
import {
  Calendar,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { compressImage } from "../utils/compressImage";
import CategoryIcon from "./CategoryIcon";

export default function EditMemoryModal({
  memory,
  categories,
  onClose,
  onSuccess,
}) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [story, setStory] = useState("");

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || "");
      setEventDate(memory.event_date || "");
      setCategoryId(memory.category_id || categories[0]?.id || "");
      setLocationName(memory.location_name || "");
      setLocationUrl(memory.location_url || "");
      setStory(memory.story || "");

      const sorted = [...(memory.memory_photos || [])].sort(
        (a, b) => a.display_order - b.display_order
      );
      setExistingPhotos(sorted);
      setPhotosToDelete([]);
      setNewFiles([]);
      setNewPreviews([]);
      setErrorMsg("");
      setStatusText("");
    }
  }, [memory, categories]);

  if (!memory) return null;

  function handleNewFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  }

  function removeExistingPhoto(photo) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setPhotosToDelete((prev) => [...prev, photo]);
  }

  function removeNewPhoto(idx) {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || !story.trim() || !eventDate) {
      setErrorMsg("Judul, tanggal, dan cerita tidak boleh kosong.");
      return;
    }

    if (existingPhotos.length + newFiles.length === 0) {
      setErrorMsg("Sisakan minimal 1 foto untuk kenangan ini.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Perbarui data teks di tabel 'memories'
      setStatusText("Menyimpan perubahan cerita...");
      const { error: updateError } = await supabase
        .from("memories")
        .update({
          title: title.trim(),
          story: story.trim(),
          event_date: eventDate,
          category_id: categoryId || null,
          location_name: locationName.trim() || null,
          location_url: locationUrl.trim() || null,
        })
        .eq("id", memory.id);

      if (updateError) throw updateError;

      // 2. Hapus foto lama yang ditandai dihapus
      if (photosToDelete.length > 0) {
        setStatusText("Menghapus foto lama...");
        const storagePaths = photosToDelete
          .map((p) => {
            const marker = "/memory-photos/";
            const idx = p.photo_url.indexOf(marker);
            return idx !== -1
              ? decodeURIComponent(p.photo_url.slice(idx + marker.length))
              : null;
          })
          .filter(Boolean);

        if (storagePaths.length > 0) {
          await supabase.storage.from("memory-photos").remove(storagePaths);
        }

        const idsToDelete = photosToDelete.map((p) => p.id);
        const { error: delPhotoErr } = await supabase
          .from("memory_photos")
          .delete()
          .in("id", idsToDelete);

        if (delPhotoErr) throw delPhotoErr;
      }

      // 3. Rapikan urutan display_order foto lama yang tersisa
      for (let i = 0; i < existingPhotos.length; i++) {
        await supabase
          .from("memory_photos")
          .update({ display_order: i })
          .eq("id", existingPhotos[i].id);
      }

      // 4. Unggah foto baru jika ada
      if (newFiles.length > 0) {
        const newPhotoRows = [];
        const startOrder = existingPhotos.length;

        for (let i = 0; i < newFiles.length; i++) {
          setStatusText(
            `Mengunggah foto baru ${i + 1} dari ${newFiles.length}...`
          );
          const compressed = await compressImage(newFiles[i]);
          const ext = compressed.type === "image/webp" ? "webp" : "jpg";
          const filePath = `${memory.id}/${Date.now()}-${i}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from("memory-photos")
            .upload(filePath, compressed, {
              contentType: compressed.type,
              upsert: false,
            });

          if (uploadErr) throw uploadErr;

          const { data: publicUrlData } = supabase.storage
            .from("memory-photos")
            .getPublicUrl(filePath);

          newPhotoRows.push({
            memory_id: memory.id,
            photo_url: publicUrlData.publicUrl,
            display_order: startOrder + i,
          });
        }

        const { error: insertNewErr } = await supabase
          .from("memory_photos")
          .insert(newPhotoRows);

        if (insertNewErr) throw insertNewErr;
      }

      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Gagal mengedit kenangan:", err);
      setErrorMsg(err.message || "Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden my-8">
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div>
            <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
              Edit Kenangan
            </h2>
            <p className="text-xs text-scrapbook-text/70 mt-0.5">
              Perbarui cerita atau kelola foto di momen ini
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Kelola Foto */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Foto Kenangan ({existingPhotos.length + newFiles.length} foto)
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2.5">
              {/* Foto Lama */}
              {existingPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden border border-pink-200 bg-pink-50"
                >
                  <img
                    src={photo.photo_url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-scrapbook-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Sampul
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => removeExistingPhoto(photo)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Foto Baru */}
              {newPreviews.map((src, idx) => (
                <div
                  key={src}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-scrapbook-primary/60 bg-pink-50"
                >
                  <img
                    src={src}
                    alt={`Baru ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    Baru
                  </span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => removeNewPhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition"
                    title="Batalkan foto baru"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Tombol Tambah Foto Lagi */}
              <label className="aspect-square rounded-lg border-2 border-dashed border-scrapbook-secondary bg-scrapbook-bg/50 hover:bg-scrapbook-bg flex flex-col items-center justify-center text-scrapbook-text/70 cursor-pointer transition">
                <ImagePlus className="w-5 h-5 text-scrapbook-primary mb-1" />
                <span className="text-[11px] font-semibold">Tambah</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewFiles}
                  disabled={submitting}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Judul */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Judul Kenangan *
            </label>
            <input
              type="text"
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
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Kategori
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = String(categoryId) === String(cat.id);
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

          {/* Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Nama Tempat
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-scrapbook-primary absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Tautan Google Maps
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-scrapbook-primary absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="url"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Cerita */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Cerita Momen Ini *
            </label>
            <textarea
              rows={3}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-pink-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
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
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
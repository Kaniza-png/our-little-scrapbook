import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  ExternalLink,
  Heart,
  Loader2,
  Map,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import CategoryIcon from "./CategoryIcon";
import { formatDateIndo } from "../utils/formatDate";

function getMapEmbedUrl(locationName, locationUrl) {
  let query = locationName || "";

  if (locationUrl) {
    const coordMatch = locationUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      query = `${coordMatch[1]},${coordMatch[2]}`;
    }
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function getExternalMapsUrl(locationName, locationUrl) {
  if (locationUrl) return locationUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    locationName || ""
  )}`;
}

export default function MemoryDetailModal({
  memory,
  isAuthenticated,
  onClose,
  onEdit,
  onDeleted,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const photos = [...(memory?.memory_photos || [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  useEffect(() => {
    setCurrentIndex(0);
    setIsPortrait(false);
    setShowMap(false);
    setConfirmDelete(false);
    setErrorMsg("");
  }, [memory]);

  useEffect(() => {
    if (!memory) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowLeft" && photos.length > 1) {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight" && photos.length > 1) {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [memory, photos.length, onClose]);

  if (!memory) return null;

  const activePhoto = photos[currentIndex]?.photo_url;

  function handleImageLoad(e) {
    const { naturalWidth, naturalHeight } = e.target;
    setIsPortrait(naturalHeight > naturalWidth);
  }

  function prevPhoto() {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function nextPhoto() {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  function handleTouchStart(e) {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e) {
    setTouchEndX(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (!touchStartX || !touchEndX || photos.length <= 1) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      prevPhoto();
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMsg("");

    try {
      const storagePaths = photos
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

      const { error } = await supabase
        .from("memories")
        .delete()
        .eq("id", memory.id);

      if (error) throw error;

      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Gagal menghapus kenangan:", err);
      setErrorMsg(err.message || "Gagal menghapus kenangan. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden"
        >
          {/* Indikator Nomor Foto (jika lebih dari 1) */}
          {photos.length > 1 && (
            <div className="absolute top-3.5 left-3.5 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
              {currentIndex + 1} / {photos.length}
            </div>
          )}

          {/* Tombol Tutup */}
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/95 text-scrapbook-text shadow-md hover:bg-scrapbook-secondary transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Area Carousel / Slider Foto (Adaptif Portrait & Landscape) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-full min-h-[240px] bg-[#2c2225] flex items-center justify-center overflow-hidden select-none transition-all duration-300"
          >
            {activePhoto ? (
              <img
                src={activePhoto}
                alt={`${memory.title} - foto ${currentIndex + 1}`}
                onLoad={handleImageLoad}
                draggable={false}
                className={`object-contain transition-all duration-300 ${
                  isPortrait
                    ? "max-h-[62vh] w-auto max-w-full"
                    : "max-h-[46vh] w-full"
                }`}
              />
            ) : (
              <div className="py-16 flex flex-col items-center text-white/60">
                <Heart className="w-10 h-10 text-scrapbook-primary/70 mb-1" />
                <span className="text-xs">Tidak ada foto</span>
              </div>
            )}

            {/* Tombol Panah & Titik Indikator jika Foto > 1 */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-scrapbook-text shadow-md hover:bg-white active:scale-95 transition"
                  title="Foto sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-scrapbook-text shadow-md hover:bg-white active:scale-95 transition"
                  title="Foto berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indikator Titik Foto */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {photos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentIndex
                          ? "w-5 bg-scrapbook-primary"
                          : "w-2 bg-white/75 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Strip Thumbnail Mini di Bawah Slider (jika Foto > 1) */}
          {photos.length > 1 && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-scrapbook-bg/60 border-b border-pink-100 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    idx === currentIndex
                      ? "border-scrapbook-primary scale-105 shadow-sm"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Isi Detail Cerita */}
          <div className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Tanggal & Kategori */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-scrapbook-primary font-handwriting text-2xl font-bold">
                <Calendar className="w-4 h-4" />
                <span>{formatDateIndo(memory.event_date)}</span>
              </div>

              {memory.categories && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-scrapbook-secondary/70 text-scrapbook-text">
                  <CategoryIcon
                    name={memory.categories.icon}
                    className="w-3.5 h-3.5 text-scrapbook-primary"
                  />
                  <span>{memory.categories.name}</span>
                </span>
              )}
            </div>

            {/* Judul */}
            <h2 className="font-handwriting text-3xl sm:text-4xl font-bold text-scrapbook-text leading-tight">
              {memory.title}
            </h2>

            {/* Lokasi & Mini-Map Interaktif */}
            {memory.location_name && (
              <div className="rounded-xl border border-scrapbook-secondary/70 bg-scrapbook-bg/60 overflow-hidden">
                <div
                  onClick={() => setShowMap((prev) => !prev)}
                  className="cursor-pointer flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs text-scrapbook-text/80 hover:bg-scrapbook-secondary/30 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-scrapbook-primary shrink-0" />
                    <span className="font-semibold truncate">
                      {memory.location_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-scrapbook-primary font-semibold border border-scrapbook-secondary shadow-xs"
                    >
                      <span>{showMap ? "Tutup Peta" : "Lihat Peta"}</span>
                      {showMap ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={getExternalMapsUrl(
                        memory.location_name,
                        memory.location_url
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-scrapbook-text/70 hover:text-scrapbook-primary font-medium"
                      title="Buka di aplikasi Google Maps"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {showMap && (
                  <div className="border-t border-scrapbook-secondary/60 bg-white">
                    <iframe
                      title={`Peta ${memory.location_name}`}
                      src={getMapEmbedUrl(
                        memory.location_name,
                        memory.location_url
                      )}
                      className="w-full h-52 border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cerita Lengkap */}
            <p className="text-sm text-scrapbook-text/90 leading-relaxed whitespace-pre-line">
              {memory.story}
            </p>

            {/* Baris Tombol Edit & Hapus (Hanya Tampil Jika Sudah Login) */}
            {isAuthenticated && (
              <div className="pt-4 border-t border-pink-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onEdit?.(memory)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-scrapbook-bg text-scrapbook-text border border-scrapbook-secondary hover:bg-scrapbook-secondary/50 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-scrapbook-primary" />
                  <span>Edit Kenangan</span>
                </button>

                {!confirmDelete ? (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menghapus...</span>
                        </>
                      ) : (
                        <span>Ya, Hapus Permanen</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
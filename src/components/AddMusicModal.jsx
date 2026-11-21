import { useEffect, useState } from "react";
import { Check, Disc3, Loader2, Music, Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AddMusicModal({ isOpen, onClose, onSuccess }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pencarian ke katalog Indonesia (ID) & Internasional (US) secara bersamaan
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setErrorMsg("");

      try {
        const encoded = encodeURIComponent(trimmed);
        const [idRes, usRes] = await Promise.allSettled([
          fetch(
            `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=10`
          ),
          fetch(
            `https://itunes.apple.com/search?term=${encoded}&country=US&media=music&entity=song&limit=6`
          ),
        ]);

        const combinedRaw = [];

        if (idRes.status === "fulfilled" && idRes.value.ok) {
          const idJson = await idRes.value.json();
          combinedRaw.push(...(idJson.results || []));
        }

        if (usRes.status === "fulfilled" && usRes.value.ok) {
          const usJson = await usRes.value.json();
          combinedRaw.push(...(usJson.results || []));
        }

        // Hapus duplikat lagu yang sama antara katalog ID dan US
        const seen = new Set();
        const uniqueTracks = [];

        for (const item of combinedRaw) {
          const uniqueKey = `${item.trackName?.toLowerCase()}-${item.artistName?.toLowerCase()}`;
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueTracks.push({
              trackId: item.trackId,
              trackName: item.trackName,
              artistName: item.artistName,
              coverUrl: item.artworkUrl100
                ? item.artworkUrl100.replace("100x100bb", "600x600bb")
                : "",
              songUrl: item.trackViewUrl,
              previewUrl: item.previewUrl || null,
            });
          }
        }

        setResults(uniqueTracks.slice(0, 12));
      } catch (err) {
        console.error("Error pencarian lagu:", err);
        setErrorMsg("Gagal mencari lagu. Periksa koneksi internet kamu.");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  function resetAndClose() {
    if (saving) return;
    setQuery("");
    setResults([]);
    setSelectedTrack(null);
    setNote("");
    setErrorMsg("");
    onClose();
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedTrack) {
      setErrorMsg("Pilih salah satu lagu dari daftar hasil pencarian dulu ya.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("favorite_songs").insert([
        {
          track_name: selectedTrack.trackName,
          artist_name: selectedTrack.artistName,
          cover_url: selectedTrack.coverUrl,
          song_url: selectedTrack.songUrl,
          preview_url: selectedTrack.previewUrl,
          note: note.trim() || null,
        },
      ]);

      if (error) throw error;

      onSuccess?.();
      resetAndClose();
    } catch (err) {
      console.error("Gagal menyimpan lagu favorit:", err);
      setErrorMsg(err.message || "Gagal menyimpan lagu ke database.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={resetAndClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-scrapbook-primary" />
            <div>
              <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
                Tambah Lagu Favorit
              </h2>
              <p className="text-[11px] text-scrapbook-text/70 mt-0.5">
                Ketik judul lagu, cover & tautan otomatis terisi
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={resetAndClose}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Pencarian & Simpan */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Input Judul Lagu */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Cari Judul Lagu atau Penyanyi *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-scrapbook-primary absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Misal: Bertaut Nadin Amizah, Komang, NIKI..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedTrack(null);
                }}
                disabled={saving}
                autoFocus
                className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
              {searching && (
                <Loader2 className="w-4 h-4 text-scrapbook-primary animate-spin absolute right-3 top-2.5" />
              )}
            </div>
          </div>

          {/* Daftar Hasil Pencarian */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-scrapbook-text/60">
                Pilih lagu yang sesuai ({results.length} hasil):
              </p>
              {results.map((track) => {
                const isSelected = selectedTrack?.trackId === track.trackId;
                return (
                  <button
                    key={track.trackId}
                    type="button"
                    disabled={saving}
                    onClick={() => setSelectedTrack(track)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-scrapbook-secondary/50 border-scrapbook-primary shadow-xs"
                        : "bg-scrapbook-bg/40 border-scrapbook-secondary/60 hover:bg-scrapbook-bg"
                    }`}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.trackName}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 border border-pink-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-scrapbook-text truncate">
                        {track.trackName}
                      </p>
                      <p className="text-[11px] text-scrapbook-text/70 truncate">
                        {track.artistName}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-scrapbook-primary text-white shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <div className="py-6 text-center text-xs text-scrapbook-text/60 bg-scrapbook-bg/40 rounded-xl border border-dashed border-scrapbook-secondary">
              <Music className="w-5 h-5 mx-auto mb-1 text-scrapbook-primary/60" />
              <span>Lagu tidak ditemukan. Coba tambahkan nama penyanyinya.</span>
            </div>
          )}

          {/* Catatan Singkat (Muncul setelah memilih lagu) */}
          {selectedTrack && (
            <div>
              <label className="block text-xs font-semibold text-scrapbook-text mb-1">
                Catatan Singkat Lagu Ini (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Lagu pas pertama kali jalan bareng"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
            </div>
          )}

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
              disabled={saving || !selectedTrack}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Lagu</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
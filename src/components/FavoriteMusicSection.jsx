import { useEffect, useRef, useState } from "react";
import {
  Disc3,
  ExternalLink,
  Music,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function FavoriteMusicSection({
  songs,
  isAuthenticated,
  onOpenAddMusic,
  onRefresh,
}) {
  const [playingId, setPlayingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const audioRef = useRef(null);

  // Hentikan audio saat komponen ditutup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function togglePreview(e, song) {
    e.preventDefault();
    e.stopPropagation();

    if (!song.preview_url) return;

    // Jika lagu yang sama sedang diputar, hentikan
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Hentikan lagu sebelumnya jika ada
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(song.preview_url);
    audio.volume = 0.7;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));

    audioRef.current = audio;
    setPlayingId(song.id);
  }

  async function handleDelete(e, songId) {
    e.preventDefault();
    e.stopPropagation();

    setDeletingId(songId);
    try {
      if (playingId === songId) {
        audioRef.current?.pause();
        setPlayingId(null);
      }

      const { error } = await supabase
        .from("favorite_songs")
        .delete()
        .eq("id", songId);

      if (error) throw error;
      onRefresh?.();
    } catch (err) {
      console.error("Gagal menghapus lagu:", err);
    } finally {
      setDeletingId(null);
    }
  }

  // Jika belum ada lagu dan pengunjung belum login, sembunyikan section agar tetap rapi
  if ((!songs || songs.length === 0) && !isAuthenticated) {
    return null;
  }

  return (
    <section className="bg-white/90 border border-scrapbook-secondary rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Header Rak Lagu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-scrapbook-secondary/60 text-scrapbook-primary">
            <Disc3 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-handwriting text-2xl sm:text-3xl font-bold text-scrapbook-text leading-none">
              Soundtrack Favorit Kita
            </h3>
            <p className="text-xs text-scrapbook-text/70 mt-0.5">
              Klik lagu untuk langsung membuka & mendengarkannya
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={onOpenAddMusic}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-scrapbook-primary text-white shadow-xs hover:bg-[#d86189] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Lagu</span>
          </button>
        )}
      </div>

      {/* Daftar Kartu Lagu */}
      {!songs || songs.length === 0 ? (
        <div className="py-5 px-4 text-center rounded-xl border border-dashed border-scrapbook-secondary bg-scrapbook-bg/40">
          <Music className="w-5 h-5 text-scrapbook-primary/70 mx-auto mb-1" />
          <p className="text-xs text-scrapbook-text/70">
            Belum ada lagu favorit. Klik <strong>+ Tambah Lagu</strong> untuk
            menambahkan lagu kenangan kalian!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {songs.map((song) => {
            const isPlaying = playingId === song.id;
            return (
              <a
                key={song.id}
                href={song.song_url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Buka lagu "${song.track_name}"`}
                className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-scrapbook-bg/70 hover:bg-scrapbook-secondary/40 border border-scrapbook-secondary/80 transition"
              >
                {/* Cover Album + Tombol Preview */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-pink-100 border border-white shadow-xs">
                  <img
                    src={song.cover_url}
                    alt={song.track_name}
                    className={`w-full h-full object-cover transition duration-300 ${
                      isPlaying ? "scale-105 brightness-75" : "group-hover:scale-105"
                    }`}
                  />
                  {song.preview_url && (
                    <button
                      type="button"
                      onClick={(e) => togglePreview(e, song)}
                      title={isPlaying ? "Jeda cuplikan" : "Putar cuplikan 30 detik"}
                      className={`absolute inset-0 m-auto w-7 h-7 rounded-full flex items-center justify-center transition ${
                        isPlaying
                          ? "bg-scrapbook-primary text-white opacity-100"
                          : "bg-black/55 text-white opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Judul Lagu & Penyanyi */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-scrapbook-text truncate group-hover:text-scrapbook-primary transition">
                      {song.track_name}
                    </p>
                    <ExternalLink className="w-3 h-3 text-scrapbook-primary/70 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-[11px] font-medium text-scrapbook-text/75 truncate">
                    {song.artist_name}
                  </p>
                  {song.note && (
                    <p className="text-[10px] italic text-scrapbook-primary truncate mt-0.5">
                      “{song.note}”
                    </p>
                  )}
                </div>

                {/* Tombol Hapus Lagu (Hanya Saat Mode Pasangan) */}
                {isAuthenticated && (
                  <button
                    type="button"
                    disabled={deletingId === song.id}
                    onClick={(e) => handleDelete(e, song.id)}
                    title="Hapus lagu dari daftar"
                    className="p-1.5 rounded-lg text-scrapbook-text/40 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
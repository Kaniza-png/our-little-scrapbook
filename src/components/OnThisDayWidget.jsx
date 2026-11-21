import { CalendarClock, ChevronRight, Heart, Sparkles } from "lucide-react";
import { formatDateIndo } from "../utils/formatDate";

export default function OnThisDayWidget({ memories, onSelectMemory }) {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const currentYear = now.getFullYear();

  // Cari kenangan dengan tanggal & bulan yang sama pada tahun-tahun sebelumnya
  const matchingMemories = (memories || []).filter((mem) => {
    if (!mem.event_date) return false;
    const [year, month, day] = mem.event_date.split("-").map(Number);
    return month === todayMonth && day === todayDay && year < currentYear;
  });

  // Jika tidak ada kenangan di tanggal & bulan hari ini pada tahun lalu, sembunyikan widget
  if (matchingMemories.length === 0) return null;

  return (
    <section className="bg-white/90 border border-scrapbook-secondary rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-scrapbook-secondary/60 text-scrapbook-primary">
            <CalendarClock className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-handwriting text-2xl sm:text-3xl font-bold text-scrapbook-text leading-none">
                Pada Hari Ini di Masa Lalu
              </h3>
              <Sparkles className="w-4 h-4 text-scrapbook-primary" />
            </div>
            <p className="text-xs text-scrapbook-text/70 mt-0.5">
              Mengenang kembali momen spesial kalian di tanggal yang sama
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matchingMemories.map((mem) => {
          const [memYear] = mem.event_date.split("-").map(Number);
          const yearsAgo = currentYear - memYear;
          const sortedPhotos = [...(mem.memory_photos || [])].sort(
            (a, b) => a.display_order - b.display_order
          );
          const coverPhoto = sortedPhotos[0]?.photo_url;

          return (
            <button
              key={mem.id}
              type="button"
              onClick={() => onSelectMemory?.(mem)}
              className="group flex items-center gap-3.5 p-3 rounded-xl bg-scrapbook-bg/70 hover:bg-scrapbook-secondary/40 border border-scrapbook-secondary/80 text-left transition"
            >
              {/* Thumbnail Foto */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-pink-100 shrink-0 border border-white shadow-xs flex items-center justify-center">
                {coverPhoto ? (
                  <img
                    src={coverPhoto}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <Heart className="w-6 h-6 text-scrapbook-primary/50" />
                )}
              </div>

              {/* Info Singkat */}
              <div className="min-w-0 flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-scrapbook-primary text-white mb-1">
                  {yearsAgo} Tahun Lalu
                </span>
                <h4 className="font-handwriting text-2xl font-bold text-scrapbook-text truncate leading-tight">
                  {mem.title}
                </h4>
                <p className="text-[11px] text-scrapbook-text/70 truncate">
                  {formatDateIndo(mem.event_date)}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-scrapbook-primary shrink-0 group-hover:translate-x-0.5 transition" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
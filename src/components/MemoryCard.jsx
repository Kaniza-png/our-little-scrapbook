import { Heart, Images, MapPin } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import { formatDateIndo } from "../utils/formatDate";

export default function MemoryCard({ memory, index, onSelect }) {
  // Urutkan foto berdasarkan display_order
  const sortedPhotos = [...(memory.memory_photos || [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const coverPhoto = sortedPhotos[0]?.photo_url;
  const totalPhotos = sortedPhotos.length;

  // Kemiringan kartu bergantian kiri & kanan agar terasa seperti scrapbook asli
  const tiltClass = index % 2 === 0 ? "-rotate-1" : "rotate-1";

  return (
    <article
      onClick={() => onSelect?.(memory)}
      className={`group cursor-pointer relative bg-scrapbook-card p-3.5 pb-5 rounded-sm shadow-md border border-pink-100 transition duration-300 hover:rotate-0 hover:shadow-xl ${tiltClass}`}
    >
      {/* Hiasan Washi Tape */}
      <div className="washi-tape w-24 h-6 mx-auto -mt-6 mb-3 rounded-sm rotate-1" />

      {/* Area Foto */}
      <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-gradient-to-br from-scrapbook-secondary/50 via-pink-100 to-amber-50 mb-3">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={memory.title}
            loading="lazy"
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-scrapbook-text/50">
            <Heart className="w-8 h-8 text-scrapbook-primary/50 mb-1" />
            <span className="text-xs font-medium">Belum ada foto</span>
          </div>
        )}

        {/* Lencana jumlah foto jika lebih dari 1 */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Images className="w-3.5 h-3.5" />
            <span>{totalPhotos}</span>
          </div>
        )}
      </div>

      {/* Tanggal & Kategori */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-handwriting text-xl font-semibold text-scrapbook-primary">
          {formatDateIndo(memory.event_date)}
        </span>
        {memory.categories && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-scrapbook-secondary/60 text-scrapbook-text">
            <CategoryIcon
              name={memory.categories.icon}
              className="w-3 h-3 text-scrapbook-primary"
            />
            <span>{memory.categories.name}</span>
          </span>
        )}
      </div>

      {/* Judul & Cerita */}
      <h3 className="font-handwriting text-2xl font-bold text-scrapbook-text leading-snug">
        {memory.title}
      </h3>
      <p className="text-sm text-scrapbook-text/80 mt-1 line-clamp-2">
        {memory.story}
      </p>

      {/* Lokasi */}
      {memory.location_name && (
        <div className="flex items-center gap-1 text-xs text-scrapbook-text/60 mt-3 pt-2.5 border-t border-pink-100">
          <MapPin className="w-3.5 h-3.5 text-scrapbook-primary shrink-0" />
          <span className="truncate">{memory.location_name}</span>
        </div>
      )}
    </article>
  );
}
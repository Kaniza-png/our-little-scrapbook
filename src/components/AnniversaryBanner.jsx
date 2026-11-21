import { CalendarHeart, Heart, PartyPopper, Settings, Sparkles } from "lucide-react";

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function calculateAnniversaryStats(anniversaryDateStr) {
  const startDate = parseLocalDate(anniversaryDateStr);
  if (!startDate) {
    return {
      daysTogether: 0,
      daysUntilNext: 0,
      nextYearCount: 1,
      isAnniversaryToday: false,
      formattedStartDate: "-",
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;

  // Hitung total hari bersama (minimal 0 jika tanggal diset di masa depan)
  const diffFromStart = Math.floor((today - startDate) / msPerDay);
  const daysTogether = Math.max(0, diffFromStart);

  // Tentukan tanggal anniversary berikutnya
  let targetYear = today.getFullYear();
  let nextAnniv = new Date(
    targetYear,
    startDate.getMonth(),
    startDate.getDate()
  );

  // Jika anniversary tahun ini sudah lewat, geser ke tahun depan
  if (nextAnniv < today) {
    targetYear += 1;
    nextAnniv = new Date(
      targetYear,
      startDate.getMonth(),
      startDate.getDate()
    );
  }

  const daysUntilNext = Math.round((nextAnniv - today) / msPerDay);
  const nextYearCount = Math.max(1, targetYear - startDate.getFullYear());
  const isAnniversaryToday = daysUntilNext === 0 && diffFromStart >= 0;

  const formattedStartDate = startDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    daysTogether,
    daysUntilNext,
    nextYearCount,
    isAnniversaryToday,
    formattedStartDate,
  };
}

export default function AnniversaryBanner({
  settings,
  isAuthenticated,
  onOpenSettings,
}) {
  const coupleNames = settings?.couple_names || "Kita Berdua";
  const stats = calculateAnniversaryStats(settings?.anniversary_date);

  return (
    <section className="bg-gradient-to-r from-scrapbook-primary to-[#df5d89] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
      {/* Ornamen Lingkaran Lembut di Latar */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-16 -bottom-10 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{coupleNames}</span>
            </span>

            {settings?.anniversary_date && (
              <span className="inline-flex items-center gap-1 text-xs text-white/85">
                <CalendarHeart className="w-3.5 h-3.5" />
                <span>Sejak {stats.formattedStartDate}</span>
              </span>
            )}
          </div>

          <h2 className="font-handwriting text-3xl sm:text-4xl font-bold flex items-center gap-2 flex-wrap pt-0.5">
            <span>
              {stats.daysTogether.toLocaleString("id-ID")} Hari Bersama & Terus
              Bertambah
            </span>
            <Heart className="w-6 h-6 fill-white/90 text-white inline shrink-0" />
          </h2>

          {stats.isAnniversaryToday ? (
            <p className="text-sm font-semibold text-white flex items-center gap-1.5 bg-white/20 w-fit px-3 py-1 rounded-xl">
              <PartyPopper className="w-4 h-4 shrink-0" />
              <span>
                Selamat Anniversary ke-{stats.nextYearCount} tahun hari ini!
              </span>
            </p>
          ) : (
            <p className="text-sm text-white/90">
              Menuju anniversary ke-{stats.nextYearCount} dalam{" "}
              <strong className="font-bold underline decoration-white/60">
                {stats.daysUntilNext} hari lagi
              </strong>
            </p>
          )}
        </div>

        {/* Tombol Pengaturan (Hanya Tampil Saat Mode Pasangan Aktif) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-xs transition"
            title="Ubah tanggal jadian, nama pasangan, atau passcode"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Atur</span>
          </button>
        )}
      </div>
    </section>
  );
}
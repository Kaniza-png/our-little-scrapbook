import { useEffect, useState } from "react";
import {
  CalendarHeart,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Settings,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SettingsModal({
  isOpen,
  settings,
  onClose,
  onSuccess,
}) {
  const [coupleNames, setCoupleNames] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && settings) {
      setCoupleNames(settings.couple_names || "");
      setAnniversaryDate(settings.anniversary_date || "");
      setPasscode(settings.passcode || "");
      setShowPasscode(false);
      setErrorMsg("");
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!coupleNames.trim() || !anniversaryDate || !passcode.trim()) {
      setErrorMsg("Nama pasangan, tanggal jadian, dan passcode wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          couple_names: coupleNames.trim(),
          anniversary_date: anniversaryDate,
          passcode: passcode.trim(),
        })
        .eq("id", 1);

      if (error) throw error;

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan pengaturan:", err);
      setErrorMsg(err.message || "Gagal menyimpan perubahan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden"
      >
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-scrapbook-primary" />
            <div>
              <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
                Pengaturan Scrapbook
              </h2>
              <p className="text-[11px] text-scrapbook-text/70 mt-0.5">
                Sesuaikan tanggal jadian & kode rahasia kalian
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 transition"
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

          {/* Nama Pasangan */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Nama Pasangan / Judul Perjalanan *
            </label>
            <div className="relative">
              <Heart className="w-4 h-4 text-scrapbook-primary absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Misal: Farel & Pasangan"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                disabled={saving}
                className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
            </div>
          </div>

          {/* Tanggal Jadian */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Tanggal Jadian / Mulai Bersama *
            </label>
            <div className="relative">
              <CalendarHeart className="w-4 h-4 text-scrapbook-primary absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                disabled={saving}
                className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
            </div>
          </div>

          {/* Passcode Bersama */}
          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Shared Passcode Login *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-scrapbook-primary absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type={showPasscode ? "text" : "password"}
                placeholder="Kode rahasia untuk edit..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={saving}
                className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                className="absolute right-3 top-2.5 text-scrapbook-text/50 hover:text-scrapbook-primary transition"
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-pink-100">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-scrapbook-text/70 hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Pengaturan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
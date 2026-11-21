import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Lock, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!passcode.trim()) {
      setErrorMsg("Masukkan passcode kalian terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("passcode")
        .eq("id", 1)
        .single();

      if (error) throw error;

      if (data && data.passcode === passcode.trim()) {
        setPasscode("");
        setShowPasscode(false);
        onLoginSuccess?.();
        onClose();
      } else {
        setErrorMsg("Passcode salah. Coba periksa kembali ya.");
      }
    } catch (err) {
      console.error("Gagal memverifikasi passcode:", err);
      setErrorMsg(
        err.message || "Gagal memverifikasi passcode. Periksa koneksi database."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setPasscode("");
    setErrorMsg("");
    setShowPasscode(false);
    onClose();
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden"
      >
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-scrapbook-primary/15 text-scrapbook-primary">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
                Masuk Ruang Kita
              </h2>
              <p className="text-[11px] text-scrapbook-text/70 mt-0.5">
                Khusus pasangan untuk menulis & mengedit kenangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-full text-scrapbook-text/60 hover:bg-scrapbook-secondary/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Passcode */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Shared Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-scrapbook-primary absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type={showPasscode ? "text" : "password"}
                placeholder="Masukkan kode rahasia..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={loading}
                autoFocus
                className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                className="absolute right-3 top-2.5 text-scrapbook-text/50 hover:text-scrapbook-primary transition"
                title={showPasscode ? "Sembunyikan kode" : "Lihat kode"}
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-scrapbook-text/70 hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <span>Buka Kunci</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
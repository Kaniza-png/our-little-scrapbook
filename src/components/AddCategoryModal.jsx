import { useState } from "react";
import { FolderPlus, Loader2, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import CategoryIcon, { ICON_MAP } from "./CategoryIcon";

export default function AddCategoryModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("heart");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Nama kategori tidak boleh kosong.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: trimmedName, icon: selectedIcon }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Nama kategori tersebut sudah ada.");
        }
        throw error;
      }

      setName("");
      setSelectedIcon("heart");
      onSuccess?.(data);
      onClose();
    } catch (err) {
      console.error("Gagal menambah kategori:", err);
      setErrorMsg(err.message || "Gagal menyimpan kategori baru.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-scrapbook-secondary overflow-hidden"
      >
        {/* Header */}
        <div className="bg-scrapbook-bg px-5 py-4 border-b border-scrapbook-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-scrapbook-primary" />
            <h3 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
              Kategori Baru
            </h3>
          </div>
          <button
            type="button"
            disabled={submitting}
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

          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1">
              Nama Kategori *
            </label>
            <input
              type="text"
              placeholder="Misal: Nonton Bioskop, Anniversary, Coffee Date"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-scrapbook-secondary focus:outline-none focus:ring-2 focus:ring-scrapbook-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-scrapbook-text mb-1.5">
              Pilih Ikon Pendamping
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(ICON_MAP).map(([key, item]) => {
                const isSelected = selectedIcon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={submitting}
                    onClick={() => setSelectedIcon(key)}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border text-[11px] font-medium transition ${
                      isSelected
                        ? "bg-scrapbook-primary text-white border-scrapbook-primary shadow-sm"
                        : "bg-scrapbook-bg/40 text-scrapbook-text border-scrapbook-secondary/70 hover:bg-scrapbook-bg"
                    }`}
                  >
                    <CategoryIcon
                      name={key}
                      className={`w-4 h-4 ${
                        isSelected ? "text-white" : "text-scrapbook-primary"
                      }`}
                    />
                    <span className="truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-pink-100">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-scrapbook-primary text-white shadow-md hover:bg-[#d86189] disabled:opacity-60 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kategori</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
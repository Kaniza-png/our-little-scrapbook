import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Heart,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Unlock,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import MemoryCard from "./components/MemoryCard";
import AddMemoryModal from "./components/AddMemoryModal";
import MemoryDetailModal from "./components/MemoryDetailModal";
import EditMemoryModal from "./components/EditMemoryModal";
import AddCategoryModal from "./components/AddCategoryModal";
import LoginModal from "./components/LoginModal";
import AnniversaryBanner from "./components/AnniversaryBanner";
import OnThisDayWidget from "./components/OnThisDayWidget";
import SettingsModal from "./components/SettingsModal";
import FavoriteMusicSection from "./components/FavoriteMusicSection";
import AddMusicModal from "./components/AddMusicModal";
import CategoryIcon from "./components/CategoryIcon";

const AUTH_STORAGE_KEY = "scrapbook_couple_auth";

export default function App() {
  const [memories, setMemories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMusicOpen, setIsAddMusicOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);

  async function fetchInitialData() {
    setLoading(true);
    setErrorMsg("");

    try {
      const [settingsRes, catRes, memRes, songsRes] = await Promise.all([
        supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("categories").select("*").order("id", { ascending: true }),
        supabase
          .from("memories")
          .select(
            `
            *,
            categories (id, name, icon),
            memory_photos (id, photo_url, display_order)
          `
          )
          .order("is_pinned", { ascending: false })
          .order("event_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("favorite_songs")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      // Tetap tampilkan data yang berhasil dimuat meskipun salah satu tabel bermasalah
      if (!settingsRes.error) setAppSettings(settingsRes.data || null);
      if (!catRes.error) setCategories(catRes.data || []);
      if (!memRes.error) setMemories(memRes.data || []);
      if (!songsRes.error) setFavoriteSongs(songsRes.data || []);

      const firstError =
        memRes.error || catRes.error || settingsRes.error || songsRes.error;
      if (firstError) {
        setErrorMsg(firstError.message);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setErrorMsg(
        err.message ||
          "Gagal terhubung ke database. Periksa file .env.local kamu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  function handleLoginSuccess() {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setIsAddModalOpen(false);
    setIsAddCategoryOpen(false);
    setIsAddMusicOpen(false);
    setIsSettingsModalOpen(false);
    setEditingMemory(null);
  }

  const filteredMemories =
    selectedCategoryId === "ALL"
      ? memories
      : memories.filter(
          (mem) => String(mem.category_id) === String(selectedCategoryId)
        );

  return (
    <div className="min-h-screen pb-24">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 bg-scrapbook-bg/90 backdrop-blur-md border-b border-scrapbook-secondary">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-scrapbook-primary text-white p-2 rounded-xl shadow-sm">
              <Heart className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h1 className="font-handwriting text-3xl font-bold text-scrapbook-text leading-none">
                Our Little Scrapbook
              </h1>
              <p className="text-xs text-scrapbook-text/70">
                Ruang kecil penyimpan cerita kita
              </p>
            </div>
          </div>

          {/* Tombol Log In / Status Mode Edit */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white text-scrapbook-text border border-scrapbook-secondary shadow-sm hover:bg-scrapbook-secondary/40 transition"
            >
              <Lock className="w-3.5 h-3.5 text-scrapbook-primary" />
              <span>Log In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-scrapbook-primary/15 text-scrapbook-primary">
                <Unlock className="w-3.5 h-3.5" />
                <span>Mode Pasangan</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white text-scrapbook-text border border-scrapbook-secondary shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                title="Kunci kembali ke mode pengunjung"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Anniversary Dinamis */}
        <AnniversaryBanner
          settings={appSettings}
          isAuthenticated={isAuthenticated}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Widget Kenangan "On This Day" */}
        {!loading && (
          <OnThisDayWidget
            memories={memories}
            onSelectMemory={(mem) => setSelectedMemory(mem)}
          />
        )}

        {/* Rak Lagu Favorit Kita */}
        {!loading && (
          <FavoriteMusicSection
            songs={favoriteSongs}
            isAuthenticated={isAuthenticated}
            onOpenAddMusic={() => setIsAddMusicOpen(true)}
            onRefresh={fetchInitialData}
          />
        )}

        {/* Pesan Error Koneksi (jika ada) */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Koneksi Database Bermasalah</p>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Area Galeri & Filter Kategori */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-handwriting text-3xl font-bold text-scrapbook-text">
              Galeri Kenangan ({filteredMemories.length})
            </h3>
          </div>

          {/* Bar Filter Kategori Cepat */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("ALL")}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition ${
                selectedCategoryId === "ALL"
                  ? "bg-scrapbook-primary text-white border-scrapbook-primary shadow-sm"
                  : "bg-white text-scrapbook-text border-scrapbook-secondary hover:bg-scrapbook-secondary/40"
              }`}
            >
              <Layers
                className={`w-3.5 h-3.5 ${
                  selectedCategoryId === "ALL"
                    ? "text-white"
                    : "text-scrapbook-primary"
                }`}
              />
              <span>Semua ({memories.length})</span>
            </button>

            {categories.map((cat) => {
              const isSelected = String(selectedCategoryId) === String(cat.id);
              const count = memories.filter(
                (m) => String(m.category_id) === String(cat.id)
              ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition ${
                    isSelected
                      ? "bg-scrapbook-primary text-white border-scrapbook-primary shadow-sm"
                      : "bg-white text-scrapbook-text border-scrapbook-secondary hover:bg-scrapbook-secondary/40"
                  }`}
                >
                  <CategoryIcon
                    name={cat.icon}
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-white" : "text-scrapbook-primary"
                    }`}
                  />
                  <span>
                    {cat.name} ({count})
                  </span>
                </button>
              );
            })}

            {/* Tombol Tambah Kategori Baru (Hanya Saat Sudah Login) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold border border-dashed border-scrapbook-primary text-scrapbook-primary bg-white/70 hover:bg-scrapbook-secondary/40 transition"
                title="Buat kategori baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kategori</span>
              </button>
            )}
          </div>

          {/* Grid Kartu Polaroid */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-scrapbook-text/70 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-scrapbook-primary" />
              <p className="text-sm font-medium">Membuka lembar scrapbook...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="bg-white/80 border-2 border-dashed border-scrapbook-secondary rounded-2xl p-10 text-center max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-scrapbook-secondary/50 text-scrapbook-primary flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-handwriting text-2xl font-bold text-scrapbook-text">
                Halaman Masih Kosong
              </h4>
              <p className="text-sm text-scrapbook-text/70 mt-1">
                {isAuthenticated
                  ? "Klik tombol + Tambah Kenangan di pojok kanan bawah untuk mengunggah momen pertama kalian!"
                  : "Belum ada kenangan yang dibagikan di halaman ini."}
              </p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="bg-white/80 border border-scrapbook-secondary rounded-2xl p-8 text-center max-w-md mx-auto my-6">
              <p className="font-handwriting text-2xl font-bold text-scrapbook-text">
                Belum ada kenangan di kategori ini
              </p>
              <p className="text-xs text-scrapbook-text/70 mt-1">
                Coba pilih kategori lain atau tampilkan semua kenangan.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategoryId("ALL")}
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold bg-scrapbook-primary text-white hover:bg-[#d86189] transition"
              >
                Tampilkan Semua Kenangan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-2">
              {filteredMemories.map((memory, index) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  index={index}
                  onSelect={(mem) => setSelectedMemory(mem)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Tombol Mengambang Tambah Kenangan (Hanya Tampil Jika Sudah Login) */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-scrapbook-primary text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:bg-[#d86189] hover:scale-105 active:scale-95 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Kenangan</span>
        </button>
      )}

      {/* Modal Login Passcode */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal Pengaturan Scrapbook */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={appSettings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={fetchInitialData}
      />

      {/* Modal Tambah Lagu Favorit */}
      <AddMusicModal
        isOpen={isAddMusicOpen}
        onClose={() => setIsAddMusicOpen(false)}
        onSuccess={fetchInitialData}
      />

      {/* Modal Tambah Kenangan */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSuccess={fetchInitialData}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
      />

      {/* Modal Detail Kenangan */}
      <MemoryDetailModal
        memory={selectedMemory}
        isAuthenticated={isAuthenticated}
        onClose={() => setSelectedMemory(null)}
        onEdit={(mem) => {
          setSelectedMemory(null);
          setEditingMemory(mem);
        }}
        onDeleted={fetchInitialData}
      />

      {/* Modal Edit Kenangan */}
      <EditMemoryModal
        memory={editingMemory}
        categories={categories}
        onClose={() => setEditingMemory(null)}
        onSuccess={fetchInitialData}
      />

      {/* Modal Tambah Kategori Baru */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={fetchInitialData}
      />
    </div>
  );
}
import {
  Plane,
  Utensils,
  Gift,
  Heart,
  Camera,
  Coffee,
  Film,
  Music,
  MapPin,
  Sparkles,
} from "lucide-react";

// Daftar ikon vektor yang tersedia untuk kategori
export const ICON_MAP = {
  plane: { label: "Perjalanan", component: Plane },
  utensils: { label: "Kuliner", component: Utensils },
  gift: { label: "Hadiah", component: Gift },
  heart: { label: "Spesial", component: Heart },
  camera: { label: "Foto", component: Camera },
  coffee: { label: "Nongkrong", component: Coffee },
  film: { label: "Nonton", component: Film },
  music: { label: "Konser", component: Music },
  mappin: { label: "Tempat", component: MapPin },
  sparkles: { label: "Momen", component: Sparkles },
};

export default function CategoryIcon({ name, className = "w-3.5 h-3.5" }) {
  const IconComponent = ICON_MAP[name]?.component || Heart;
  return <IconComponent className={className} />;
}
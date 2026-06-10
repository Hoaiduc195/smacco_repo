import {
  ArrowUpDown,
  Bath,
  BedDouble,
  Bus,
  Car,
  Clock,
  Coffee,
  Dumbbell,
  HelpCircle,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react';

const AMENITY_ALIASES = [
  { key: 'wifi', label: 'Wifi', icon: Wifi, aliases: ['wifi', 'wi fi', 'wi-fi', 'internet', 'free wifi', 'free wi fi', 'free wi-fi'] },
  { key: 'pool', label: 'Hồ bơi', icon: Waves, aliases: ['pool', 'swimming pool', 'outdoor pool', 'indoor pool', 'hồ bơi'] },
  { key: 'parking', label: 'Bãi đỗ xe', icon: Car, aliases: ['parking', 'free parking', 'car park', 'bãi đỗ xe', 'đỗ xe'] },
  { key: 'spa', label: 'Spa', icon: Sparkles, aliases: ['spa', 'wellness'] },
  { key: 'massage', label: 'Massage', icon: Sparkles, aliases: ['massage', 'mát xa'] },
  { key: 'restaurant', label: 'Nhà hàng', icon: Utensils, aliases: ['restaurant', 'dining', 'breakfast', 'nhà hàng', 'bữa sáng'] },
  { key: 'bar', label: 'Bar', icon: Wine, aliases: ['bar', 'lounge', 'pub'] },
  { key: 'gym', label: 'Gym', icon: Dumbbell, aliases: ['gym', 'fitness', 'fitness center', 'fitness centre', 'phòng gym'] },
  { key: 'ac', label: 'Điều hòa', icon: Snowflake, aliases: ['ac', 'air conditioning', 'air conditioner', 'điều hòa', 'máy lạnh'] },
  { key: 'tv', label: 'TV', icon: Tv, aliases: ['tv', 'television'] },
  { key: 'shuttle', label: 'Đưa đón', icon: Bus, aliases: ['shuttle', 'airport shuttle', 'transfer', 'đưa đón'] },
  { key: 'elevator', label: 'Thang máy', icon: ArrowUpDown, aliases: ['elevator', 'lift', 'thang máy'] },
  { key: 'reception247', label: 'Lễ tân 24/7', icon: Clock, aliases: ['reception247', '24 hour front desk', '24-hour front desk', 'front desk', 'lễ tân 24/7'] },
  { key: 'coffee', label: 'Cà phê', icon: Coffee, aliases: ['coffee', 'cafe', 'cà phê'] },
  { key: 'security', label: 'An ninh', icon: ShieldCheck, aliases: ['security', 'safe', 'safety', 'an ninh'] },
  { key: 'bath', label: 'Phòng tắm', icon: Bath, aliases: ['bath', 'bathtub', 'private bathroom', 'phòng tắm'] },
  { key: 'room', label: 'Phòng nghỉ', icon: BedDouble, aliases: ['room', 'rooms', 'bed', 'bedroom', 'phòng nghỉ'] },
];

function normalizeAmenity(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatUnknownAmenity(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Tiện ích';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAmenityMeta(amenity) {
  const normalized = normalizeAmenity(amenity);
  const match = AMENITY_ALIASES.find((item) => (
    item.aliases.some((alias) => {
      const normalizedAlias = normalizeAmenity(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    })
  ));

  if (match) {
    return {
      key: match.key,
      label: match.label,
      Icon: match.icon,
    };
  }

  return {
    key: normalized || 'unknown',
    label: formatUnknownAmenity(amenity),
    Icon: HelpCircle,
  };
}

export default function AmenityBadge({ amenity, compact = false, className = '' }) {
  const { label, Icon } = getAmenityMeta(amenity);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm ${compact ? 'px-2 py-1 text-[11px] font-bold' : 'px-3 py-1.5 text-xs font-bold'} ${className}`}
      title={label}
    >
      <Icon className={compact ? 'h-3.5 w-3.5 text-primary-600' : 'h-4 w-4 text-primary-600'} />
      <span className="line-clamp-1">{label}</span>
    </span>
  );
}

import { Trash2, Settings2, CalendarDays, MapPin, LockKeyhole, Gift, House, Target, Trophy, User, Plus, ArrowRight, ChevronLeft, Menu, Zap, BookOpen, Activity, Smartphone, QrCode, Pencil, Clock, Search, Check, Pause, Play, Leaf, Bell } from 'lucide-react-native';
const icons = { trash: Trash2, settings: Settings2, calendar: CalendarDays, pin: MapPin, lock: LockKeyhole, gift: Gift, home: House, target: Target, trophy: Trophy, user: User, plus: Plus, arrow: ArrowRight, back: ChevronLeft, menu: Menu, bolt: Zap, book: BookOpen, activity: Activity, phone: Smartphone, qr: QrCode, edit: Pencil, clock: Clock, search: Search, check: Check, pause: Pause, play: Play, leaf: Leaf, bell: Bell };
export type IconName = keyof typeof icons;
export function Icon({ name, color = '#0A9FF5', size = 24 }: { name: IconName; color?: string; size?: number }) {
 const Glyph = icons[name];
 return <Glyph size={size} color={color} strokeWidth={1.7} />;
}

import {
  Layers,
  Grid3x3,
  LayoutGrid,
  PaintBucket,
  Construction,
  Warehouse,
  Waves,
  Flame,
  Droplets,
  Zap,
  Trees,
  Fence,
  Frame,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Layers,
  Grid3x3,
  LayoutGrid,
  PaintBucket,
  Construction,
  Warehouse,
  Waves,
  Flame,
  Droplets,
  Zap,
  Trees,
  Fence,
  Frame,
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? HelpCircle;
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

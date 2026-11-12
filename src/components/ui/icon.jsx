// Komponen icon konsisten (lucide-react). Stroke 1.75 default, 1.5 untuk <=16px.
import { cn } from "@/lib/utils";

export const ICON_SIZE = { sm: 16, md: 20, lg: 24 };

export function Icon({ as: Cmp, size = "md", strokeWidth, className, ...p }) {
  if (!Cmp) return null;
  return (
    <Cmp
      size={ICON_SIZE[size]}
      strokeWidth={strokeWidth ?? (ICON_SIZE[size] <= 16 ? 1.5 : 1.75)}
      className={cn("shrink-0", className)}
      {...p}
    />
  );
}

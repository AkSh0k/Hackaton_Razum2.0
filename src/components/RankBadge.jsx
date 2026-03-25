import { cn } from "@/lib/utils";

const rankStyles = {
  Bronze: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Silver: "bg-slate-400/10 text-slate-300 border-slate-400/20",
  Gold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Platinum: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Diamond: "bg-blue-500/10 text-blue-300 border-blue-500/20",
};

const sizeStyles = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-3 py-1 text-xs",
  lg: "px-3.5 py-1.5 text-sm",
};

export default function RankBadge({ rank = "Bronze", size = "sm" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        rankStyles[rank] || rankStyles.Bronze,
        sizeStyles[size] || sizeStyles.sm
      )}
    >
      {rank}
    </span>
  );
}

import { cn } from "@/lib/utils";

const categoryStyles = {
  IT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Социальные проекты": "bg-green-500/10 text-green-400 border-green-500/20",
  Медиа: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Наука: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Лидерство: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Спорт: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Искусство: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function CategoryTag({ category, count, small = false }) {
  const styles = categoryStyles[category] || "bg-secondary text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        styles
      )}
    >
      <span>{category || "Другое"}</span>
      {typeof count === "number" && (
        <span className="text-[10px] text-muted-foreground/80">{count}</span>
      )}
    </span>
  );
}

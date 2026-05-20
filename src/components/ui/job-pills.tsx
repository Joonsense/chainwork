import { MapPin, Zap } from "lucide-react";
import { formatSalary } from "@/lib/format";

/** Salary range pill — mono text on a faint blue→purple wash. */
export function SalaryPill({
  min,
  max,
  size = "md",
}: {
  min: number;
  max: number;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-semibold text-text-primary ${
        size === "sm" ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, oklch(0.4 0.16 250 / 0.2), oklch(0.4 0.18 295 / 0.14))",
        borderColor: "oklch(0.55 0.18 270 / 0.35)",
      }}
    >
      <span className="text-accent-blue">$</span>
      {formatSalary(min, max).replace("$", "")}
    </span>
  );
}

/** Location pill with a pin glyph. */
export function LocationPill({
  location,
  size = "md",
}: {
  location: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-subtle bg-glass text-text-bright ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
      }`}
    >
      <MapPin size={11} className="shrink-0 text-text-tertiary" />
      {location}
    </span>
  );
}

/** Skill tag — mono chip on a faint glass fill. */
export function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[5px] border border-line bg-glass-hi px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-text-bright">
      {children}
    </span>
  );
}

/** Sponsored marker — amber chip. */
export function SponsoredBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide"
      style={{
        color: "oklch(0.88 0.13 75)",
        backgroundColor: "oklch(0.4 0.14 75 / 0.18)",
        borderColor: "oklch(0.55 0.16 75 / 0.35)",
      }}
    >
      <Zap size={8} strokeWidth={2.4} className="fill-current" />
      sponsored
    </span>
  );
}

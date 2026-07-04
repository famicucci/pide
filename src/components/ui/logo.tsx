import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-logo uppercase leading-none tracking-tight text-primary select-none",
        className
      )}
    >
      La Cuadra
    </span>
  );
}

export function LogoBadge({ className }: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-white aspect-square",
        className
      )}
    >
      <span className="font-logo uppercase leading-[0.85] tracking-tight text-center">
        La
        <br />
        Cuadra
      </span>
    </div>
  );
}

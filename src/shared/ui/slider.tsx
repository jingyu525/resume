import { cn } from "@/shared/lib/cn";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}

export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className,
  ...rest
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={rest["aria-label"]}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary",
        "accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

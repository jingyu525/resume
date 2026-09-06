import { cn } from "@/shared/lib/cn";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  className?: string;
  "aria-label"?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
  ...rest
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        "flex w-full overflow-hidden rounded-xl border border-border bg-secondary p-1",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          title={opt.label}
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "i18n-truncate min-w-0 flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors cursor-pointer",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

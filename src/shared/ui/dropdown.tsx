import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { useDismiss } from "./use-dismiss";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({ trigger, items, align = "end", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-48 max-w-72 rounded-xl border border-border bg-popover p-1.5 shadow-xl",
            "animate-in fade-in zoom-in-95",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                item.danger
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-popover-foreground hover:bg-secondary",
              )}
            >
              {item.icon}
              <span className="i18n-truncate" title={item.label}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

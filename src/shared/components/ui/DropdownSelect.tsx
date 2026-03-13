import { useState, useRef, useEffect, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Clock, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DropdownSelectProps<T> {
  items: T[];
  selected: T | null;
  getId: (item: T) => string;
  isSpent?: (item: T) => boolean;
  onSelect: (item: T) => void;
  renderTrigger: (item: T) => ReactNode;
  renderOption: (item: T, opts: { selected: boolean; spent: boolean }) => ReactNode;
  label?: string;
  placeholder?: string;
  emptyText?: string;
  spentLabel?: string;
  emptyHint?: ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DropdownSelect<T>({
  items,
  selected,
  getId,
  isSpent = () => false,
  onSelect,
  renderTrigger,
  renderOption,
  label,
  placeholder = "Select…",
  emptyText = "No records found.",
  spentLabel = "spent",
  emptyHint,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [showSpent, setShowSpent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unspent = items.filter((r) => !isSpent(r));
  const spent = items.filter((r) => isSpent(r));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
          open
            ? "border-primary ring-1 ring-primary"
            : selected
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-input hover:border-primary/40",
        ].join(" ")}
      >
        {selected ? (
          <div className="flex flex-1 items-center justify-between min-w-0 gap-2">
            {renderTrigger(selected)}
            <X
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown popover */}
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
          {unspent.length === 0 && spent.length === 0 ? (
            <div className="px-3 py-4 space-y-2">
              <p className="text-sm text-muted-foreground">{emptyText}</p>
              {emptyHint}
            </div>
          ) : (
            <>
              {unspent.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  No spendable records — all are {spentLabel}.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto py-1">
                  {unspent.map((item) => {
                    const id = getId(item);
                    const isSel = selected !== null && getId(selected) === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleSelect(item)}
                        className={[
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                          isSel ? "bg-primary/10" : "hover:bg-secondary/60",
                        ].join(" ")}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSel
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSel && <Check className="h-2.5 w-2.5" />}
                        </span>
                        {renderOption(item, { selected: isSel, spent: false })}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Spent section (collapsed by default) */}
              {spent.length > 0 && (
                <div className="border-t border-border">
                  <button
                    onClick={() => setShowSpent((s) => !s)}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSpent ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {spent.length} {spentLabel}
                  </button>

                  {showSpent && (
                    <div className="max-h-32 overflow-y-auto border-t border-border/50 py-1 opacity-50">
                      {spent.map((item) => (
                        <div
                          key={getId(item)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground"
                        >
                          <Clock className="h-3 w-3 shrink-0" />
                          {renderOption(item, { selected: false, spent: true })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

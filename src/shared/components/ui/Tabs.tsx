interface TabItem<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, className = "" }: Props<T>) {
  return (
    <div className={`flex rounded-xl border border-border bg-secondary p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={[
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
            active === tab.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

import type { CreatorToken } from "@/shared/hooks/useCreatorTokens";

interface Props {
  tokens: CreatorToken[];
  selectedId: string;
  onSelect: (tokenId: string) => void;
}

export function TokenPicker({ tokens, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {tokens.map((t) => (
        <button
          key={t.tokenId}
          onClick={() => onSelect(t.tokenId)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
            selectedId === t.tokenId
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              {t.metadata?.symbolStr ?? t.tokenId}
              {t.metadata?.nameStr && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  {t.metadata.nameStr}
                </span>
              )}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{t.tokenId}</p>
        </button>
      ))}
    </div>
  );
}

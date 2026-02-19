import { useMemo } from "react";
import type { AuctionConfig } from "@/shared/types/auction";
import { computePriceCurve } from "../utils/price";

interface Props {
  config: AuctionConfig;
  currentBlock: number;
  currentPrice: bigint | null;
}

export function PriceChart({ config, currentBlock, currentPrice }: Props) {
  const { points, viewBox, pathD, areaD, markerPos } = useMemo(() => {
    const pts = computePriceCurve(config);
    if (pts.length === 0) return { points: pts, viewBox: "0 0 600 300", pathD: "", areaD: "", markerPos: null };

    const W = 600;
    const H = 300;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    const minBlock = pts[0].block;
    const maxBlock = pts[pts.length - 1].block;
    const maxPrice = Number(config.start_price);
    const minPrice = Number(config.floor_price);
    const priceRange = maxPrice - minPrice || 1;
    const blockRange = maxBlock - minBlock || 1;

    const toX = (b: number) => pad.left + ((b - minBlock) / blockRange) * innerW;
    const toY = (p: bigint) => pad.top + (1 - (Number(p) - minPrice) / priceRange) * innerH;

    const coords = pts.map((pt) => ({ x: toX(pt.block), y: toY(pt.price) }));
    const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
    const area = `${line} L${coords[coords.length - 1].x},${pad.top + innerH} L${coords[0].x},${pad.top + innerH} Z`;

    let marker = null;
    if (currentBlock >= minBlock && currentBlock <= maxBlock && currentPrice !== null) {
      marker = { x: toX(currentBlock), y: toY(currentPrice) };
    }

    return { points: pts, viewBox: `0 0 ${W} ${H}`, pathD: line, areaD: area, markerPos: marker };
  }, [config, currentBlock, currentPrice]);

  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-md-custom h-full">
      <h4 className="mb-3 font-semibold text-foreground">Price Decay Curve</h4>
      <svg viewBox={viewBox} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="price-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#price-area-fill)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current position marker */}
        {markerPos && (
          <>
            <line x1={markerPos.x} y1="20" x2={markerPos.x} y2="260" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <circle cx={markerPos.x} cy={markerPos.y} r="6" fill="var(--accent)" stroke="white" strokeWidth="2" className="animate-pulse-subtle" />
            <text x={markerPos.x + 10} y={markerPos.y - 10} fill="var(--accent)" fontSize="11" fontWeight="600">
              {currentPrice?.toLocaleString()}
            </text>
          </>
        )}

        {/* Axes labels */}
        <text x="60" y="290" fill="var(--muted-foreground)" fontSize="10">
          Block {config.start_block.toLocaleString()}
        </text>
        <text x="520" y="290" fill="var(--muted-foreground)" fontSize="10" textAnchor="end">
          Block {config.end_block.toLocaleString()}
        </text>
        <text x="12" y="30" fill="var(--muted-foreground)" fontSize="10">
          {config.start_price.toLocaleString()}
        </text>
        <text x="12" y="260" fill="var(--muted-foreground)" fontSize="10">
          {config.floor_price.toLocaleString()}
        </text>
      </svg>
    </div>
  );
}

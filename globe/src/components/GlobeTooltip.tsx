import { AggregatedCountry, formatValue } from "@/lib/tradeData";
import { valueColorScale } from "@/lib/colors";

interface GlobeTooltipProps {
  data: AggregatedCountry | null;
  position: { x: number; y: number };
}

const GlobeTooltip = ({ data, position }: GlobeTooltipProps) => {
  if (!data) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none glass-panel px-4 py-3 min-w-[200px] animate-fade-in-up"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        borderColor: valueColorScale(data.normalizedValue),
        borderWidth: 1,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: valueColorScale(data.normalizedValue) }}
        />
        <span className="font-semibold text-sm">{data.country}</span>
        <span className="ml-auto data-label">#{data.rank}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="data-label">Export Value</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {formatValue(data.exportValue)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="data-label">Buyers</span>
          <span className="font-mono text-sm text-secondary-foreground">
            {data.buyerCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobeTooltip;

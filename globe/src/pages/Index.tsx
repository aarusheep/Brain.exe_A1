import { useState, useEffect, useCallback, useRef } from "react";
import TradeGlobe from "@/components/TradeGlobe";
import SidePanel from "@/components/SidePanel";
import GlobeTooltip from "@/components/GlobeTooltip";
import { useCsvParser } from "@/hooks/useCsvParser";
import {
  SAMPLE_DATA,
  getProducts,
  aggregateByCountry,
  type TradeRecord,
  type AggregatedCountry,
} from "@/lib/tradeData";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [data, setData] = useState<TradeRecord[]>(SAMPLE_DATA);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState("Sample Dataset");
  const [hoveredCountry, setHoveredCountry] = useState<AggregatedCountry | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const [globeReady, setGlobeReady] = useState(false);
  const { parseFile, isLoading } = useCsvParser();

  const products = getProducts(data);
  const aggregatedData = aggregateByCountry(data, selectedProduct);

  useEffect(() => {
    const timer = setTimeout(() => setGlobeReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Track mouse position globally for tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const records = await parseFile(file);
        if (records.length > 0) {
          setData(records);
          setDatasetName(file.name);
          setSelectedProduct(null);
        }
      } catch (err) {
        console.error("Failed to parse CSV:", err);
      }
    },
    [parseFile]
  );

  const handleHover = useCallback(
    (data: AggregatedCountry | null) => {
      setHoveredCountry(data);
      setTooltipPos(mousePos.current);
    },
    []
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background cyber-grid">
      {/* Side Panel */}
      <aside className="flex-shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-sm z-10">
        <SidePanel
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          aggregatedData={aggregatedData}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          datasetName={datasetName}
        />
      </aside>

      {/* Globe Area */}
      <main className="flex-1 relative">
        {!globeReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-mono text-sm text-muted-foreground glow-text">
                Initializing Globe...
              </p>
            </div>
          </div>
        )}
        <TradeGlobe aggregatedData={aggregatedData} onHover={handleHover} />

        {/* Status bar */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <div className="glass-panel px-3 py-1.5 text-xs font-mono text-muted-foreground">
            {selectedProduct ? `Product: ${selectedProduct}` : "All Products"} • {aggregatedData.length} countries
          </div>
          <div className="glass-panel px-3 py-1.5 text-xs font-mono text-muted-foreground">
            GlobeXMatch v1.0 • Trade Intelligence
          </div>
        </div>
      </main>

      {/* Tooltip */}
      <GlobeTooltip data={hoveredCountry} position={tooltipPos} />
    </div>
  );
};

export default Index;

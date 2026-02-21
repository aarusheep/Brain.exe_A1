import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe from "react-globe.gl";
import { AggregatedCountry, COUNTRY_TO_ISO } from "@/lib/tradeData";
import { getHeatColor, getPolygonAltitude } from "@/lib/colors";

interface TradeGlobeProps {
  aggregatedData: AggregatedCountry[];
  onHover: (data: AggregatedCountry | null) => void;
}

const GEOJSON_URL = "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

const TradeGlobe = ({ aggregatedData, onHover }: TradeGlobeProps) => {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Build lookup from ISO A3 → aggregated data
  const isoToData = useMemo(() => {
    const map = new Map<string, AggregatedCountry>();
    for (const item of aggregatedData) {
      const iso = COUNTRY_TO_ISO[item.country];
      if (iso) map.set(iso, item);
    }
    return map;
  }, [aggregatedData]);

  // Load GeoJSON
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then(setCountries)
      .catch(console.error);
  }, []);

  // Auto-rotate and initial camera
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = true;
    globe.pointOfView({ altitude: 2.5 });

    // Custom globe material
    const scene = globe.scene();
    if (scene) {
      scene.background = null;
    }
  }, []);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const getColor = useCallback(
    (feat: any) => {
      const iso = feat.properties?.ISO_A3;
      const data = isoToData.get(iso);
      if (!data) return "rgba(30, 41, 59, 0.6)";
      const color = getHeatColor(data.normalizedValue);
      const opacity = 0.7 + data.normalizedValue * 0.3;
      return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
    },
    [isoToData]
  );

  const getSideColor = useCallback(
    (feat: any) => {
      const iso = feat.properties?.ISO_A3;
      const data = isoToData.get(iso);
      if (!data) return "rgba(30, 41, 59, 0.3)";
      const color = getHeatColor(data.normalizedValue);
      return color.replace("rgb(", "rgba(").replace(")", ", 0.5)");
    },
    [isoToData]
  );

  const getAltitude = useCallback(
    (feat: any) => {
      const iso = feat.properties?.ISO_A3;
      const data = isoToData.get(iso);
      if (!data) return 0.005;
      return getPolygonAltitude(data.normalizedValue);
    },
    [isoToData]
  );

  const handlePolygonHover = useCallback(
    (polygon: any) => {
      if (!polygon) {
        onHover(null);
        const globe = globeRef.current;
        if (globe) globe.controls().autoRotate = true;
        return;
      }
      const iso = polygon.properties?.ISO_A3;
      const data = isoToData.get(iso);
      onHover(data || null);

      const globe = globeRef.current;
      if (globe) globe.controls().autoRotate = false;
    },
    [isoToData, onHover]
  );

  const getLabel = useCallback(
    (feat: any) => {
      const iso = feat.properties?.ISO_A3;
      const data = isoToData.get(iso);
      if (!data) return "";
      return "";
    },
    [isoToData]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Globe glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, hsl(187 100% 50% / 0.08) 0%, transparent 60%)",
        }}
      />
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="hsl(187, 100%, 50%)"
          atmosphereAltitude={0.2}
          polygonsData={countries.features}
          polygonCapColor={getColor}
          polygonSideColor={getSideColor}
          polygonAltitude={getAltitude}
          polygonStrokeColor={() => "rgba(79, 195, 247, 0.2)"}
          polygonLabel={getLabel}
          onPolygonHover={handlePolygonHover}
          polygonsTransitionDuration={800}
        />
      )}
    </div>
  );
};

export default TradeGlobe;

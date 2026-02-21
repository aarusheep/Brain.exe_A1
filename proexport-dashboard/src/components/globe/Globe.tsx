import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactGlobe from 'react-globe.gl';
import { COUNTRY_COORDS, DEFAULT_COORD } from '@/lib/countryData';

interface GlobeProps {
    onCountryHover?: (country: string | null) => void;
    targetCountry?: string;
    className?: string;
}

const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

const Globe: React.FC<GlobeProps> = ({ targetCountry, className }) => {
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [countries, setCountries] = useState<any>({ features: [] });
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    useEffect(() => {
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => setCountries(data));
    }, []);

    // Sync Globe Position with targetCountry
    useEffect(() => {
        if (globeRef.current && targetCountry) {
            const coord = COUNTRY_COORDS[targetCountry] || DEFAULT_COORD;
            globeRef.current.pointOfView(
                { lat: coord.lat, lng: coord.lng, altitude: coord.altitude || 3.0 }, // Further zoom out for safety
                1500
            );
        }
    }, [targetCountry]);

    const getPolygonColor = useCallback((feat: any) => {
        const isTarget = feat.properties.NAME === targetCountry;
        const isHovered = feat.properties.NAME === hoveredCountry;

        if (isTarget) return 'rgba(56, 189, 248, 0.7)';
        if (isHovered) return 'rgba(56, 189, 248, 0.3)';
        return 'rgba(255, 255, 255, 0.05)'; // Subtle country outlines
    }, [targetCountry, hoveredCountry]);

    return (
        <div ref={containerRef} className={`relative w-full h-full min-h-[500px] overflow-hidden flex items-center justify-center bg-[#050b18] ${className}`}>
            <ReactGlobe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                polygonsData={countries.features}
                polygonCapColor={getPolygonColor}
                polygonSideColor={() => 'rgba(255, 255, 255, 0.02)'}
                polygonStrokeColor={() => 'rgba(255, 255, 255, 0.1)'}
                polygonLabel={(d: any) => `
          <div class="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white shadow-xl">
            <p class="font-bold">${d.properties.NAME}</p>
          </div>
        `}
                onPolygonHover={(feat: any) => setHoveredCountry(feat?.properties?.NAME || null)}
                waitForGlobeReady={true}
                animateIn={true}
            />
        </div>
    );
};

export default Globe;

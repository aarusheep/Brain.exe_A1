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
    const globeRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [countries, setCountries] = useState<any>({ features: [] });
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => setCountries(data));

        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Sync Globe Position with targetCountry
    useEffect(() => {
        if (globeRef.current && targetCountry) {
            const coord = COUNTRY_COORDS[targetCountry] || DEFAULT_COORD;
            globeRef.current.pointOfView(
                { lat: coord.lat, lng: coord.lng, altitude: coord.altitude || 2.5 }, // Increased altitude
                1500 // Smooth transition duration
            );
        }
    }, [targetCountry]);

    const getPolygonColor = useCallback((feat: any) => {
        const isTarget = feat.properties.NAME === targetCountry;
        const isHovered = feat.properties.NAME === hoveredCountry;

        if (isTarget) return 'rgba(56, 189, 248, 0.7)'; // Sky-400
        if (isHovered) return 'rgba(56, 189, 248, 0.3)';
        return 'rgba(30, 41, 59, 0.4)'; // Slate-800
    }, [targetCountry, hoveredCountry]);

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
            <ReactGlobe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                polygonsData={countries.features}
                polygonCapColor={getPolygonColor}
                polygonSideColor={() => 'rgba(15, 23, 42, 0.2)'}
                polygonStrokeColor={() => '#1e293b'}
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

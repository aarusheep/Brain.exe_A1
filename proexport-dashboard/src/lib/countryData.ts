export interface CountryCoord {
    lat: number;
    lng: number;
    altitude?: number;
}

export const COUNTRY_COORDS: Record<string, CountryCoord> = {
    "USA": { lat: 37.0902, lng: -95.7129, altitude: 2.5 },
    "United States": { lat: 37.0902, lng: -95.7129, altitude: 2.5 },
    "Germany": { lat: 51.1657, lng: 10.4515, altitude: 2.5 },
    "China": { lat: 35.8617, lng: 104.1954, altitude: 2.5 },
    "India": { lat: 20.5937, lng: 78.9629, altitude: 2.5 },
    "UK": { lat: 55.3781, lng: -3.4360, altitude: 2.5 },
    "United Kingdom": { lat: 55.3781, lng: -3.4360, altitude: 2.5 },
    "France": { lat: 46.2276, lng: 2.2137, altitude: 2.5 },
    "Japan": { lat: 36.2048, lng: 138.2529, altitude: 2.5 },
    "Netherlands": { lat: 52.1326, lng: 5.2913, altitude: 2.5 },
    "Italy": { lat: 41.8719, lng: 12.5674, altitude: 2.5 },
    "UAE": { lat: 23.4241, lng: 53.8478, altitude: 2.5 },
    "United Arab Emirates": { lat: 23.4241, lng: 53.8478, altitude: 2.5 },
    "Canada": { lat: 56.1304, lng: -106.3468, altitude: 2.5 },
    "Australia": { lat: -25.2744, lng: 133.7751, altitude: 2.5 },
    "Singapore": { lat: 1.3521, lng: 103.8198, altitude: 2.5 },
    "Brazil": { lat: -14.2350, lng: -51.9253, altitude: 2.5 },
    "South Africa": { lat: -30.5595, lng: 22.9375, altitude: 2.5 },
    "Mexico": { lat: 23.6345, lng: -102.5528, altitude: 2.5 },
};

export const DEFAULT_COORD: CountryCoord = { lat: 20, lng: 0, altitude: 4.5 };

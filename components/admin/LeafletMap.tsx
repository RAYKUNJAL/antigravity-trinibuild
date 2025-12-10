import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon missing in React Leaflet
// (Though we are using CircleMarkers so strictly not needed, but good practice)

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number; // 0 to 1
    type: 'listing' | 'ride' | 'event' | 'search';
    title: string;
}

interface LeafletMapProps {
    points: HeatmapPoint[];
}

const LeafletMap: React.FC<LeafletMapProps> = ({ points }) => {
    // Trinidad bounds to keep view focused
    const center: [number, number] = [10.45, -61.25]; // Approximate center of T&T
    const zoom = 9;

    const getColor = (type: string) => {
        switch (type) {
            case 'listing': return '#ef4444'; // Red
            case 'ride': return '#f59e0b'; // Amber
            case 'event': return '#8b5cf6'; // Violet
            case 'search': return '#3b82f6'; // Blue
            default: return '#10b981';
        }
    };

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((point, idx) => (
                <CircleMarker
                    key={idx}
                    center={[point.lat, point.lng]}
                    radius={5 + (point.intensity * 5)} // 5px to 10px
                    pathOptions={{
                        color: getColor(point.type),
                        fillColor: getColor(point.type),
                        fillOpacity: 0.6,
                        weight: 1
                    }}
                >
                    <Popup>
                        <div className="text-sm font-medium">
                            <span className="capitalize font-bold">{point.type}</span>: {point.title}
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
};

export default LeafletMap;

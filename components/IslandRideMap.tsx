import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const ISLANDS: Record<string, { center: [number, number]; zoom: number }> = {
  Trinidad: { center: [10.45, -61.28], zoom: 9 },
  Tobago: { center: [11.25, -60.67], zoom: 10 },
};

export const IslandRideMap: React.FC<{
  island?: string;
  pins?: Array<{ id: string; name: string; plate?: string; pinLat?: number | null; pinLng?: number | null }>;
  tripPoint?: { lat: number; lng: number } | null;
  height?: string;
}> = ({ island = 'Trinidad', pins = [], tripPoint = null, height = '220px' }) => {
  const view = ISLANDS[island] || ISLANDS.Trinidad;
  const listedPins = pins.filter((p) => Number.isFinite(Number(p.pinLat)) && Number.isFinite(Number(p.pinLng)));

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200" style={{ height }}>
      <MapContainer center={view.center} zoom={view.zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listedPins.map((pin) => (
          <Marker key={pin.id} position={[Number(pin.pinLat), Number(pin.pinLng)]}>
            <Popup>{pin.name}{pin.plate ? ` · ${pin.plate}` : ''}</Popup>
          </Marker>
        ))}
        {tripPoint && Number.isFinite(tripPoint.lat) && Number.isFinite(tripPoint.lng) ? (
          <Marker position={[tripPoint.lat, tripPoint.lng]}>
            <Popup>Accepted trip</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
};

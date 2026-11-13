import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { CARIBBEAN_OVERVIEW, mapViewFor, type LatLng } from '../services/caribbeanIslands';
import {
  browserMapsKey,
  hasDevWatermark,
  loadGoogleMapsApi,
  type GoogleMapHandle,
  type GoogleMarkerHandle,
} from './googleMapsLoader';

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export type TrackingPin = LatLng & { title?: string; kind?: 'vehicle' | 'stop' };

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function OsmMap({
  center,
  zoom,
  vehicle,
  stops,
  height,
}: {
  center: LatLng;
  zoom: number;
  vehicle: TrackingPin | null;
  stops: TrackingPin[];
  height: string;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} zoom={zoom} />
        {vehicle ? (
          <Marker position={[vehicle.lat, vehicle.lng]}>
            <Popup>{vehicle.title || 'Provider'}</Popup>
          </Marker>
        ) : null}
        {stops.map((s, i) => (
          <Marker key={`${s.lat},${s.lng},${i}`} position={[s.lat, s.lng]}>
            <Popup>{s.title || 'Stop'}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function GoogleMapView({
  apiKey,
  center,
  zoom,
  vehicle,
  stops,
  height,
  onFail,
}: {
  apiKey: string;
  center: LatLng;
  zoom: number;
  vehicle: TrackingPin | null;
  stops: TrackingPin[];
  height: string;
  onFail: (reason: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapHandle | null>(null);
  const vehicleRef = useRef<GoogleMarkerHandle | null>(null);
  const stopRefs = useRef<GoogleMarkerHandle[]>([]);
  const failed = useRef(false);

  const fail = (reason: string) => {
    if (failed.current) return;
    failed.current = true;
    onFail(reason);
  };

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    loadGoogleMapsApi(apiKey)
      .then((maps) => {
        if (cancelled || failed.current) return;
        if (hasDevWatermark(host)) {
          fail('development-watermark');
          return;
        }
        const map = new maps.Map(host, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        const check = () => {
          if (hasDevWatermark(host) || hasDevWatermark(map.getDiv?.() || host)) {
            fail('development-watermark');
          }
        };
        setTimeout(check, 400);
        setTimeout(check, 1500);
        setTimeout(check, 4000);
      })
      .catch((err) => fail(err instanceof Error ? err.message : 'load-failed'));
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    map.setCenter(center);
    map.setZoom(zoom);
    if (vehicle) {
      if (!vehicleRef.current) {
        vehicleRef.current = new window.google.maps.Marker({
          position: vehicle,
          map,
          title: vehicle.title || 'Provider',
        });
      } else {
        vehicleRef.current.setPosition(vehicle);
        vehicleRef.current.setMap(map);
      }
    } else if (vehicleRef.current) {
      vehicleRef.current.setMap(null);
    }
    stopRefs.current.forEach((m) => m.setMap(null));
    stopRefs.current = stops.map(
      (s) =>
        new window.google.maps.Marker({
          position: s,
          map,
          title: s.title || 'Stop',
        }),
    );
  }, [center.lat, center.lng, zoom, vehicle, stops]);

  return (
    <div
      ref={hostRef}
      className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#111]"
      style={{ height }}
      data-map-provider="google"
    />
  );
}

/**
 * Map provider abstraction. Tries Google Maps JS when VITE_GOOGLE_MAPS_API_KEY
 * is a real key. On a missing key, a loader/auth error, or the
 * "For development purposes only" watermark, falls back to OSM / Leaflet.
 * Defaults frame the nearest Caribbean island — not a T&T hard-code.
 * A vehicle pin is only drawn when the caller passes one (live fix).
 */
export const TrackingMap: React.FC<{
  vehicle?: TrackingPin | null;
  stops?: TrackingPin[];
  height?: string;
}> = ({ vehicle = null, stops = [], height = '280px' }) => {
  const key = browserMapsKey();
  const [provider, setProvider] = useState<'google' | 'osm'>(key ? 'google' : 'osm');
  const anchor = vehicle || stops[0] || null;
  const view = anchor
    ? mapViewFor(anchor)
    : { center: CARIBBEAN_OVERVIEW.center, zoom: CARIBBEAN_OVERVIEW.defaultZoom };

  useEffect(() => {
    if (!key) setProvider('osm');
  }, [key]);

  if (provider === 'google' && key) {
    return (
      <GoogleMapView
        apiKey={key}
        center={view.center}
        zoom={view.zoom}
        vehicle={vehicle}
        stops={stops}
        height={height}
        onFail={() => setProvider('osm')}
      />
    );
  }

  return <OsmMap center={view.center} zoom={view.zoom} vehicle={vehicle} stops={stops} height={height} />;
};

export function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

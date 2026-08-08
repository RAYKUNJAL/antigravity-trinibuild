// =============================================================
// Ride Safety + Map Ecosystem service
// Safety features proven in India/Africa markets:
//  • OTP ride-start: rider gives driver a 4-digit code — stops wrong-car pickups
//  • Live trip sharing: one-tap WhatsApp share of a public tracking link
//  • SOS: instant WhatsApp alert with live location to emergency contact
// Map ecosystem: geocoded business pins + turn-by-turn directions links
// =============================================================
import { supabase } from './supabaseClient';

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- OTP ride-start (rider shows driver the code) ----------
export async function issueStartOtp(rideId: string): Promise<string> {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const share_token = uid() + uid();
    const { error } = await supabase.from('rides').update({ start_otp: otp, share_token }).eq('id', rideId);
    if (error) throw error;
    return otp;
}

export async function verifyStartOtp(rideId: string, code: string): Promise<boolean> {
    const { data } = await supabase.from('rides').select('start_otp').eq('id', rideId).single();
    return !!data && String(data.start_otp) === String(code).trim();
}

// ---------- Live trip sharing ----------
export async function getTripShareLink(rideId: string): Promise<string> {
    const { data } = await supabase.from('rides').select('share_token').eq('id', rideId).single();
    let token = data?.share_token;
    if (!token) {
        token = uid() + uid();
        await supabase.from('rides').update({ share_token: token }).eq('id', rideId);
    }
    return `${window.location.origin}/ride-tracker/${rideId}?t=${token}`;
}

export async function shareTripOnWhatsApp(rideId: string, riderName?: string) {
    const link = await getTripShareLink(rideId);
    const msg = `🚗 ${riderName || 'I'}'m on a ride — follow my trip live here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---------- SOS ----------
export async function triggerSOS(rideId: string, opts: { lat?: number; lng?: number; contactPhone?: string }) {
    await supabase.from('rides').update({ sos_triggered_at: new Date().toISOString() }).eq('id', rideId);
    const loc = opts.lat && opts.lng ? `My live location: https://maps.google.com/?q=${opts.lat},${opts.lng}` : '';
    const link = await getTripShareLink(rideId).catch(() => '');
    const msg = `🆘 EMERGENCY — I need help. I'm on a ride right now. ${loc} ${link ? `Trip: ${link}` : ''}`.trim();
    const target = opts.contactPhone ? `https://wa.me/${opts.contactPhone.replace(/\D/g, '')}?text=` : 'https://wa.me/?text=';
    window.open(target + encodeURIComponent(msg), '_blank');
    return true;
}

// ---------- Map ecosystem: businesses with directions ----------
export interface MapBusiness {
    id: string; name: string; category?: string; lat: number; lng: number;
    address?: string; slug?: string;
}

export async function getBusinessesForMap(): Promise<MapBusiness[]> {
    const { data, error } = await supabase
        .from('stores')
        .select('id,name,category,lat,lng,address,slug')
        .eq('status', 'active')
        .not('lat', 'is', null)
        .limit(500);
    if (error) throw error;
    return (data || []) as MapBusiness[];
}

// Turn-by-turn directions — works on every phone, no API key
export function directionsUrl(destLat: number, destLng: number, destName?: string): string {
    const q = destName ? encodeURIComponent(destName) : `${destLat},${destLng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=&travelmode=driving`;
}

// OSRM route polyline for in-app Leaflet rendering (free, no key, already CSP-allowed)
export async function fetchRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return null;
        return {
            coords: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]) as [number, number][],
            distanceKm: Math.round(route.distance / 100) / 10,
            durationMin: Math.round(route.duration / 60),
        };
    } catch { return null; }
}

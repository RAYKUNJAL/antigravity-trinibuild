// =============================================================
// Island Filter System — the shared "which island am I in / browsing"
// control used across rides, search, stores, jobs, and real estate.
// =============================================================
import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

export interface Island { code: string; name: string; currency: string; currency_symbol: string; rides_enabled: boolean }

const IslandCtx = createContext<{
    island: Island | null; islands: Island[]; setIslandByCode: (code: string) => void; loading: boolean;
}>({ island: null, islands: [], setIslandByCode: () => {}, loading: true });

const STORAGE_KEY = 'juvay_island';

export function IslandProvider({ children }: { children: React.ReactNode }) {
    const [islands, setIslands] = useState<Island[]>([]);
    const [island, setIsland] = useState<Island | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from('island_config').select('code,name,currency,currency_symbol,rides_enabled').order('name')
            .then(({ data }) => {
                const list = (data || []) as Island[];
                setIslands(list);
                const saved = localStorage.getItem(STORAGE_KEY);
                const found = list.find((i) => i.code === saved);
                setIsland(found || list.find((i) => i.code === 'TT') || list[0] || null);
                setLoading(false);
            });
    }, []);

    const setIslandByCode = (code: string) => {
        const found = islands.find((i) => i.code === code);
        if (found) { setIsland(found); localStorage.setItem(STORAGE_KEY, code); }
    };

    return <IslandCtx.Provider value={{ island, islands, setIslandByCode, loading }}>{children}</IslandCtx.Provider>;
}

export const useIsland = () => useContext(IslandCtx);

export function IslandSelector({ compact = false }: { compact?: boolean }) {
    const { island, islands, setIslandByCode, loading } = useIsland();
    const [open, setOpen] = useState(false);
    if (loading || !island) return null;

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 font-bold rounded-lg transition-colors ${compact ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3.5 py-2'} bg-gray-900 hover:bg-gray-800 border border-gray-700`}>
                🏝️ {island.name} <span className="text-gray-500">▾</span>
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                        {islands.map((i) => (
                            <button key={i.code} onClick={() => { setIslandByCode(i.code); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-900 flex items-center justify-between ${i.code === island.code ? 'text-[#FFD700] font-bold' : 'text-gray-300'}`}>
                                {i.name}
                                <span className="text-xs text-gray-600">{i.currency_symbol}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function filterByIsland<T>(query: any, islandCode: string | undefined, column = 'island_code') {
    if (!islandCode) return query;
    return query.eq(column, islandCode);
}

export async function getStoresForIsland(islandCode: string) {
    const { data } = await supabase.from('stores').select('id,name,category,lat,lng,address,slug')
        .eq('status', 'active').eq('island_code', islandCode).limit(200);
    return data || [];
}

export async function getRidesAvailability(islandCode: string): Promise<boolean> {
    const { data } = await supabase.from('island_config').select('rides_enabled').eq('code', islandCode).single();
    return !!data?.rides_enabled;
}

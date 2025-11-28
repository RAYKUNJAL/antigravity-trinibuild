import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, ExternalLink, Info } from 'lucide-react';
import { getAdsForPage, recordImpression, recordClick, AdCampaign } from '../services/adService';

interface AdSpotProps {
    page: string;
    slot: 'top' | 'bottom' | 'sidebar';
    className?: string;
}

export const AdSpot: React.FC<AdSpotProps> = ({ page, slot, className = '' }) => {
    const [ad, setAd] = useState<AdCampaign | null>(null);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const ads = getAdsForPage(page);
        // Assign slots: 'top' gets 1st ad, 'bottom' gets 2nd ad, 'sidebar' gets 3rd
        let selectedAd = null;
        if (slot === 'top' && ads.length > 0) selectedAd = ads[0];
        if (slot === 'bottom' && ads.length > 1) selectedAd = ads[1];
        if (slot === 'sidebar' && ads.length > 2) selectedAd = ads[2];

        if (selectedAd) {
            setAd(selectedAd);
            recordImpression(selectedAd.id);
        }
    }, [page, slot]);

    const handleClick = () => {
        if (ad) {
            recordClick(ad.id);
            window.open(ad.targetUrl, '_blank');
        }
    };

    if (!ad) return null;

    return (
        <div className={`relative w-full overflow-hidden rounded-xl shadow-lg group bg-black border border-gray-800 ${className}`}>
            {/* Label */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Sponsored
                </span>
                {ad.isPaidClient && (
                    <span className="bg-trini-red text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center">
                        <Info className="w-3 h-3 mr-1" /> Featured Partner
                    </span>
                )}
            </div>

            {/* Video */}
            <video
                ref={videoRef}
                src={ad.videoUrl}
                className="w-full h-[200px] md:h-[300px] object-cover opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                autoPlay
                loop
                muted={muted}
                playsInline
                onClick={handleClick}
            />

            {/* Controls & Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 z-20 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white">
                    <p className="text-xs text-gray-300 mb-1">Advertisement</p>
                    <h4 className="font-bold text-lg leading-tight mb-2">{ad.clientName}</h4>
                    <button
                        onClick={handleClick}
                        className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center hover:bg-gray-200 transition-colors"
                    >
                        Visit Site <ExternalLink className="ml-1 h-3 w-3" />
                    </button>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMuted(!muted);
                    }}
                    className="bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
};

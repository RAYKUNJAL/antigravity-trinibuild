import React, { useState, useRef, useEffect } from 'react';
import { Video, Loader2, AlertCircle, Check, Settings } from 'lucide-react';
import { WatermarkEngine, WatermarkOptions, isWatermarkSupported } from '../../services/watermarkEngine';

interface VideoWatermarkPreviewProps {
    videoFile: File | null;
    onWatermarked?: (blob: Blob, url: string) => void;
}

export function VideoWatermarkPreview({ videoFile, onWatermarked }: VideoWatermarkPreviewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    const engineRef = useRef<WatermarkEngine | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [options, setOptions] = useState<WatermarkOptions>({
        trinibuildEnabled: true,
        trinibuildOpacity: 0.18,
        trinibuildPosition: 'bottom_right',
        vendorOpacity: 0.26,
    });

    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new WatermarkEngine();
        }

        return () => {
            engineRef.current?.cleanup();
        };
    }, []);

    useEffect(() => {
        if (videoFile) {
            applyWatermark();
        }
    }, [videoFile]);

    const applyWatermark = async () => {
        if (!videoFile || !engineRef.current) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            // Simulate progress (actual progress tracking is complex with MediaRecorder)
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const result = await engineRef.current.addWatermark(videoFile, options);

            clearInterval(progressInterval);
            setProgress(100);

            setWatermarkedUrl(result.url);

            if (onWatermarked) {
                onWatermarked(result.blob, result.url);
            }
        } catch (err: any) {
            console.error('Watermark failed:', err);
            setError(err.message || 'Failed to apply watermark');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isWatermarkSupported()) {
        return (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-white mb-2">Watermarking Not Supported</h4>
                    <p className="text-sm text-[#A9B0C3]">
                        Your browser doesn't support client-side video watermarking.
                        Please use Chrome, Edge, or Firefox for best results.
                    </p>
                </div>
            </div>
        );
    }

    if (!videoFile) {
        return (
            <div className="bg-[#0B0D14] rounded-xl p-12 text-center border-2 border-dashed border-[#1E2235]">
                <Video className="h-16 w-16 text-[#A9B0C3] mx-auto mb-4" />
                <p className="text-[#A9B0C3]">Upload a video to see watermark preview</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Settings Toggle */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Watermark Preview</h3>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-sm text-[#A9B0C3] hover:text-white flex items-center gap-2"
                >
                    <Settings className="h-4 w-4" />
                    {showSettings ? 'Hide' : 'Show'} Settings
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-[#0B0D14] rounded-xl p-6 space-y-4">
                    <div>
                        <label className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                checked={options.trinibuildEnabled}
                                onChange={(e) => setOptions({ ...options, trinibuildEnabled: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span className="text-white font-semibold">Enable TriniBuild Watermark</span>
                        </label>
                    </div>

                    {options.trinibuildEnabled && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Position
                                </label>
                                <select
                                    value={options.trinibuildPosition}
                                    onChange={(e) => setOptions({ ...options, trinibuildPosition: e.target.value as any })}
                                    className="w-full bg-[#101320] text-white px-4 py-2 rounded-lg border border-[#1E2235]"
                                >
                                    <option value="bottom_right">Bottom Right</option>
                                    <option value="bottom_left">Bottom Left</option>
                                    <option value="top_right">Top Right</option>
                                    <option value="top_left">Top Left</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Opacity: {Math.round(options.trinibuildOpacity * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.5"
                                    step="0.01"
                                    value={options.trinibuildOpacity}
                                    onChange={(e) => setOptions({ ...options, trinibuildOpacity: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                            </div>

                            <button
                                onClick={applyWatermark}
                                disabled={isProcessing}
                                className="w-full bg-[#00B894] hover:bg-[#009071] text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                            >
                                Reapply Watermark
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
                <div className="bg-[#0B0D14] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="h-5 w-5 text-[#00B894] animate-spin" />
                        <span className="text-white font-semibold">Processing video...</span>
                    </div>
                    <div className="bg-[#1E2235] rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-[#00B894] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-[#A9B0C3] mt-2">
                        This may take a moment for longer videos...
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-white mb-1">Processing Error</h4>
                        <p className="text-sm text-[#A9B0C3]">{error}</p>
                    </div>
                </div>
            )}

            {/* Video Preview */}
            <div className="bg-[#0B0D14] rounded-xl overflow-hidden">
                {watermarkedUrl ? (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            src={watermarkedUrl}
                            controls
                            className="w-full max-h-[500px]"
                        />
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                            <Check className="h-3 w-3" />
                            Watermark Applied
                        </div>
                    </div>
                ) : (
                    <video
                        src={URL.createObjectURL(videoFile)}
                        controls
                        className="w-full max-h-[500px]"
                    />
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-[#A9B0C3]">
                    <strong className="text-white">Note:</strong> Watermark is applied during upload to ensure brand consistency.
                    The watermark will be visible in all placements of this video.
                </p>
            </div>
        </div>
    );
}

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Loader2 } from 'lucide-react';
import { videoService } from '../services/videoService';

interface VideoUploadProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, currentUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        // Reset state
        setError(null);
        setUploading(true);
        setProgress(0);

        // Simulate progress since Supabase client doesn't expose it easily yet
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 5;
            });
        }, 500);

        try {
            const url = await videoService.uploadVideo(file, 'videos', (p) => {
                // This callback is currently only called with 100 at the end
                // But we can use it if we improve the service later
                if (p === 100) setProgress(100);
            });

            clearInterval(progressInterval);
            setProgress(100);
            onUploadComplete(url);
        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message || 'Upload failed');
            setUploading(false);
        } finally {
            // Keep uploading true for a moment to show 100%
            setTimeout(() => {
                setUploading(false);
            }, 1000);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-bold text-gray-900 mb-2">
                Upload Video File
            </label>

            {!uploading && !currentUrl && (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                        ${dragActive ? 'border-trini-red bg-red-50' : 'border-gray-300 hover:border-trini-red hover:bg-gray-50'}
                        ${error ? 'border-red-500 bg-red-50' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    />

                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <Upload className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-1">MP4, WebM, MOV (Max 500MB)</p>
                        </div>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Uploading Video...</p>
                                <p className="text-xs text-gray-500">{progress}% complete</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-3">
                        Please do not close this window
                    </p>
                </div>
            )}

            {!uploading && currentUrl && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-green-900">Upload Complete</p>
                            <p className="text-xs text-green-700 truncate max-w-[200px]">{currentUrl}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onUploadComplete('');
                            setError(null);
                        }}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700 transition-colors"
                        title="Remove video"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {error && !uploading && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm text-red-900">Upload Failed</p>
                        <p className="text-xs text-red-700 mt-1">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-xs font-bold text-red-800 underline mt-2"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

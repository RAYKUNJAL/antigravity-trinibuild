import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { videoService } from '../services/videoService';

interface VideoUploadProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, currentUrl }) => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset status
        setStatus('uploading');
        setProgress(0);
        setErrorMessage('');

        try {
            // validate file type
            if (!file.type.startsWith('video/')) {
                throw new Error('Please upload a valid video file (MP4, WebM, etc.)');
            }

            // validate file size (500MB)
            if (file.size > 500 * 1024 * 1024) {
                throw new Error('File size exceeds 500MB limit');
            }

            // Start fake progress for UX (since supabase client doesn't give granular events easily)
            const interval = setInterval(() => {
                setProgress(p => Math.min(p + 10, 90));
            }, 500);

            console.log('Starting upload for:', file.name);
            const url = await videoService.uploadVideo(file, 'videos');

            clearInterval(interval);
            setProgress(100);
            setStatus('success');
            onUploadComplete(url);
            console.log('Upload complete:', url);

        } catch (error: any) {
            console.error('Upload failed:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to upload video');
        }
    };

    const handleClear = () => {
        setStatus('idle');
        setProgress(0);
        setErrorMessage('');
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-900">
                    Upload Video File <span className="text-xs font-normal text-green-600">(New System V2)</span>
                </label>
            </div>

            {/* IDLE STATE */}
            {status === 'idle' && !currentUrl && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-trini-red hover:bg-gray-50 rounded-xl p-8 text-center cursor-pointer transition-all"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <Upload className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Click to upload video</p>
                            <p className="text-xs text-gray-500 mt-1">MP4, WebM, MOV (Max 500MB)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOADING STATE */}
            {status === 'uploading' && (
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <div>
                            <p className="font-bold text-gray-900">Uploading...</p>
                            <p className="text-xs text-gray-500">{progress}% complete</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* SUCCESS / EXISTING FILE STATE */}
            {(status === 'success' || currentUrl) && status !== 'uploading' && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-green-900">Video Ready</p>
                            <p className="text-xs text-green-700 truncate max-w-[200px]">
                                {currentUrl || 'Upload successful'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700"
                        title="Remove video"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold text-red-900">Upload Failed</p>
                            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-xs font-bold text-red-800 underline mt-2"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

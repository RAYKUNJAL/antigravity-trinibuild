import React, { useState, useRef, useEffect } from 'react';
import * as tus from 'tus-js-client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Pause, Play, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface VideoUploadTusProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
}

export const VideoUploadTus: React.FC<VideoUploadTusProps> = ({ onUploadComplete, currentUrl }) => {
    const [upload, setUpload] = useState<tus.Upload | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (upload) {
                upload.abort();
            }
        };
    }, [upload]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset state
        setStatus('uploading');
        setProgress(0);
        setErrorMessage('');

        try {
            // 1. Validation
            if (!file.type.startsWith('video/')) {
                throw new Error('Please upload a valid video file (MP4, WebM, etc.)');
            }
            if (file.size > 500 * 1024 * 1024) { // 500MB
                throw new Error('File size exceeds 500MB limit');
            }

            // 2. Get Session for Auth
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('You must be logged in to upload videos');
            }

            // 3. Generate Filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            const fileName = `video_${timestamp}_${randomStr}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            // 4. Initialize TUS Upload
            const projectId = import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]; // Hacky but works for standard supabase URLs, better to just use the URL
            // Actually, better to construct from the full URL
            const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`;

            const newUpload = new tus.Upload(file, {
                endpoint: uploadUrl,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true', // Optional: overwrite if exists
                },
                metadata: {
                    bucketName: 'site-assets',
                    objectName: filePath,
                    contentType: file.type,
                    cacheControl: '3600',
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                onError: (error) => {
                    console.error('TUS Upload Failed:', error);
                    setStatus('error');
                    setErrorMessage('Upload failed: ' + error.message);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                    setProgress(parseFloat(percentage));
                },
                onSuccess: async () => {
                    console.log('TUS Upload Complete');
                    setStatus('success');

                    // Get Public URL
                    const { data: urlData } = supabase.storage
                        .from('site-assets')
                        .getPublicUrl(filePath);

                    onUploadComplete(urlData.publicUrl);
                },
            });

            // 5. Start Upload
            newUpload.start();
            setUpload(newUpload);

        } catch (error: any) {
            console.error('Initialization failed:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to start upload');
        }
    };

    const togglePause = () => {
        if (!upload) return;
        if (status === 'uploading') {
            upload.abort();
            setStatus('paused');
        } else if (status === 'paused') {
            upload.start();
            setStatus('uploading');
        }
    };

    const handleClear = () => {
        if (upload) {
            upload.abort();
        }
        setUpload(null);
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
                    Upload Video <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">TUS Resumable</span>
                </label>
            </div>

            {/* IDLE STATE */}
            {status === 'idle' && !currentUrl && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-xl p-8 text-center cursor-pointer transition-all group"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full group-hover:bg-purple-100 transition-colors">
                            <Upload className="h-8 w-8 text-gray-400 group-hover:text-purple-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">Click to upload video</p>
                            <p className="text-sm text-gray-500 mt-1">MP4, WebM, MOV (Max 500MB)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOADING / PAUSED STATE */}
            {(status === 'uploading' || status === 'paused') && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status === 'uploading' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                                {status === 'uploading' ? (
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                ) : (
                                    <Pause className="h-5 w-5 text-yellow-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">
                                    {status === 'uploading' ? 'Uploading Video...' : 'Upload Paused'}
                                </p>
                                <p className="text-xs text-gray-500">{progress.toFixed(1)}% complete</p>
                            </div>
                        </div>
                        <button
                            onClick={togglePause}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title={status === 'uploading' ? "Pause" : "Resume"}
                        >
                            {status === 'uploading' ? (
                                <Pause className="h-5 w-5 text-gray-600" />
                            ) : (
                                <Play className="h-5 w-5 text-green-600" />
                            )}
                        </button>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${status === 'paused' ? 'bg-yellow-400' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-3">
                        {status === 'uploading' ? 'Do not close this window' : 'Upload paused. Click play to resume.'}
                    </p>
                </div>
            )}

            {/* SUCCESS / EXISTING FILE STATE */}
            {(status === 'success' || (currentUrl && status === 'idle')) && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-green-900">Video Ready</p>
                            <p className="text-xs text-green-700 truncate max-w-[250px] opacity-80">
                                {currentUrl || 'Upload successful'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700 transition-colors"
                        title="Remove video"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold text-red-900">Upload Failed</p>
                            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                            <div className="flex gap-3 mt-3">
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        if (upload) upload.start(); // Retry
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <RefreshCw className="h-3 w-3" /> Retry
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="text-xs font-bold text-red-800 hover:underline px-2 py-1.5"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

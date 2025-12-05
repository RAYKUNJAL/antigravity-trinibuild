import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface VideoUploadProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, currentUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setError(null);
        setUploading(true);
        setProgress(0);

        // Progress simulation
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        try {
            // Validate file type
            const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
            if (!validTypes.includes(file.type)) {
                throw new Error(`Invalid file type. Please upload MP4, WebM, MOV, or AVI files.`);
            }

            // Validate file size (500MB)
            if (file.size > 500 * 1024 * 1024) {
                throw new Error(`File too large. Maximum size is 500MB.`);
            }

            // Check auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to upload videos.');
            }

            // Generate filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            const fileName = `video_${timestamp}_${randomStr}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            console.log('Uploading to site-assets:', filePath);

            // Upload
            const { data, error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error(uploadError.message || 'Upload failed');
            }

            if (!data?.path) {
                throw new Error('Upload succeeded but no path returned');
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL');
            }

            clearInterval(progressInterval);
            setProgress(100);
            console.log('Upload successful:', urlData.publicUrl);
            onUploadComplete(urlData.publicUrl);

        } catch (err: any) {
            clearInterval(progressInterval);
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
            setUploading(false);
        } finally {
            setTimeout(() => {
                setUploading(false);
            }, 1000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-bold text-gray-900 mb-2">
                Upload Video File
            </label>

            {!uploading && !currentUrl && (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-trini-red hover:bg-gray-50 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/avi"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <Upload className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Click to upload</p>
                            <p className="text-xs text-gray-500 mt-1">MP4, WebM, MOV, AVI (Max 500MB)</p>
                        </div>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <div>
                            <p className="font-bold text-gray-900">Uploading...</p>
                            <p className="text-xs text-gray-500">{progress}% complete</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {!uploading && currentUrl && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-green-900">Upload Complete</p>
                            <p className="text-xs text-green-700 truncate max-w-[200px]">{currentUrl}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onUploadComplete('');
                            setError(null);
                        }}
                        className="p-2 hover:bg-green-100 rounded-full text-green-700"
                        title="Remove video"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {error && !uploading && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
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

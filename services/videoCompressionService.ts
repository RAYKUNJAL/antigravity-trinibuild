import { supabase } from './supabaseClient';

export interface VideoCompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    format?: 'mp4' | 'webm';
    generateThumbnail?: boolean;
}

export interface VideoUploadResult {
    url: string;
    thumbnailUrl?: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    duration: number;
    width: number;
    height: number;
}

const QUALITY_PRESETS = {
    low: { crf: 28, preset: 'fast', bitrate: '500k' },
    medium: { crf: 23, preset: 'medium', bitrate: '1000k' },
    high: { crf: 20, preset: 'slow', bitrate: '2000k' },
    ultra: { crf: 18, preset: 'slower', bitrate: '4000k' }
};

export const videoCompressionService = {
    /**
     * Upload and compress video file
     */
    async uploadAndCompressVideo(
        file: File,
        options: VideoCompressionOptions = {}
    ): Promise<VideoUploadResult> {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 'medium',
            format = 'mp4',
            generateThumbnail = true
        } = options;

        try {
            // Validate file
            this.validateVideoFile(file);

            // Get file metadata
            const metadata = await this.getVideoMetadata(file);

            // Compress video using Supabase Edge Function
            const compressedBlob = await this.compressVideo(file, {
                maxWidth,
                maxHeight,
                quality,
                format
            });

            // Generate thumbnail if requested
            let thumbnailUrl: string | undefined;
            if (generateThumbnail) {
                const thumbnailBlob = await this.generateThumbnail(file);
                thumbnailUrl = await this.uploadToStorage(thumbnailBlob, 'thumbnails');
            }

            // Upload compressed video
            const videoUrl = await this.uploadToStorage(compressedBlob, 'videos');

            // Calculate compression stats
            const originalSize = file.size;
            const compressedSize = compressedBlob.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

            return {
                url: videoUrl,
                thumbnailUrl,
                originalSize,
                compressedSize,
                compressionRatio,
                duration: metadata.duration,
                width: metadata.width,
                height: metadata.height
            };
        } catch (error) {
            console.error('Video upload failed:', error);
            throw new Error('Failed to upload and compress video');
        }
    },

    /**
     * Validate video file
     */
    validateVideoFile(file: File): void {
        const maxSize = 500 * 1024 * 1024; // 500MB
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid video format. Allowed: MP4, WebM, MOV, AVI');
        }

        if (file.size > maxSize) {
            throw new Error('Video file too large. Maximum size: 500MB');
        }
    },

    /**
     * Get video metadata using video element
     */
    async getVideoMetadata(file: File): Promise<{
        duration: number;
        width: number;
        height: number;
    }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };

            video.onerror = () => {
                reject(new Error('Failed to load video metadata'));
            };

            video.src = URL.createObjectURL(file);
        });
    },

    /**
     * Compress video using Supabase Edge Function
     */
    async compressVideo(
        file: File,
        options: {
            maxWidth: number;
            maxHeight: number;
            quality: 'low' | 'medium' | 'high' | 'ultra';
            format: 'mp4' | 'webm';
        }
    ): Promise<Blob> {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('options', JSON.stringify(options));

        const { data, error } = await supabase.functions.invoke('compress-video', {
            body: formData
        });

        if (error) throw error;

        // Convert base64 to blob
        const byteCharacters = atob(data.compressed);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: `video/${options.format}` });
    },

    /**
     * Generate video thumbnail
     */
    async generateThumbnail(file: File, timeOffset: number = 1): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.onloadedmetadata = () => {
                video.currentTime = Math.min(timeOffset, video.duration / 2);
            };

            video.onseeked = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate thumbnail'));
                    }
                }, 'image/jpeg', 0.85);

                window.URL.revokeObjectURL(video.src);
            };

            video.onerror = () => {
                reject(new Error('Failed to load video for thumbnail'));
            };

            video.src = URL.createObjectURL(file);
        });
    },

    /**
     * Upload to Supabase Storage
     */
    async uploadToStorage(blob: Blob, folder: 'videos' | 'thumbnails'): Promise<string> {
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const extension = blob.type.split('/')[1];
        const fullPath = `${fileName}.${extension}`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(fullPath, blob, {
                cacheControl: '31536000', // 1 year
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(data.path);

        return publicUrl;
    },

    /**
     * Client-side video compression (fallback if Edge Function unavailable)
     */
    async compressVideoClientSide(
        file: File,
        options: VideoCompressionOptions
    ): Promise<Blob> {
        // This is a simplified client-side compression
        // For production, use the Edge Function with FFmpeg

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        return new Promise((resolve, reject) => {
            video.onloadedmetadata = async () => {
                const { maxWidth = 1920, maxHeight = 1080 } = options;

                // Calculate new dimensions
                let width = video.videoWidth;
                let height = video.videoHeight;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Note: This is a placeholder
                // Real compression requires MediaRecorder API or FFmpeg.wasm
                reject(new Error('Client-side compression not fully implemented. Use Edge Function.'));
            };

            video.onerror = () => reject(new Error('Failed to load video'));
            video.src = URL.createObjectURL(file);
        });
    },

    /**
     * Get optimal video settings based on use case
     */
    getOptimalSettings(useCase: 'hero' | 'background' | 'product' | 'tutorial'): VideoCompressionOptions {
        const settings: Record<string, VideoCompressionOptions> = {
            hero: {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 'high',
                format: 'mp4',
                generateThumbnail: true
            },
            background: {
                maxWidth: 1280,
                maxHeight: 720,
                quality: 'medium',
                format: 'webm',
                generateThumbnail: false
            },
            product: {
                maxWidth: 1280,
                maxHeight: 720,
                quality: 'high',
                format: 'mp4',
                generateThumbnail: true
            },
            tutorial: {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 'ultra',
                format: 'mp4',
                generateThumbnail: true
            }
        };

        return settings[useCase] || settings.product;
    }
};

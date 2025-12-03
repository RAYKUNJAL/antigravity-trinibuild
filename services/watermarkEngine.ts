// TriniBuild Watermark Engine - Client-Side Canvas Implementation
// MVP version for quick integration

export interface WatermarkOptions {
    trinibuildEnabled: boolean;
    trinibuildOpacity: number;
    trinibuildPosition: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
    vendorLogoUrl?: string;
    vendorOpacity: number;
    vendorPosition?: string;
}

export interface WatermarkResult {
    blob: Blob;
    url: string;
    duration: number;
    width: number;
    height: number;
}

export class WatermarkEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private trinibuildLogo: HTMLImageElement | null = null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    async loadTrinibuildLogo(): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.trinibuildLogo = img;
                resolve();
            };
            img.onerror = reject;
            // In production, this would be your actual watermark
            img.src = '/watermarks/trinibuild-logo.png';
        });
    }

    async addWatermark(
        videoFile: File,
        options: WatermarkOptions
    ): Promise<WatermarkResult> {
        const startTime = Date.now();

        // Load video
        const video = await this.loadVideo(videoFile);

        // Set canvas dimensions
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;

        // Load watermark logo if needed
        if (options.trinibuildEnabled && !this.trinibuildLogo) {
            await this.loadTrinibuildLogo();
        }

        // Record watermarked video
        const watermarkedBlob = await this.recordVideo(video, options);

        const duration = Date.now() - startTime;
        const url = URL.createObjectURL(watermarkedBlob);

        return {
            blob: watermarkedBlob,
            url,
            duration,
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    private loadVideo(file: File): Promise<HTMLVideoElement> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                video.currentTime = 0;
            };

            video.onseeked = () => {
                resolve(video);
            };

            video.onerror = reject;
            video.src = URL.createObjectURL(file);
        });
    }

    private async recordVideo(
        video: HTMLVideoElement,
        options: WatermarkOptions
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const chunks: BlobPart[] = [];

            // Start video playback
            video.currentTime = 0;
            video.play();

            // Create media recorder
            const stream = this.canvas.captureStream(30); // 30 FPS
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            recorder.onerror = reject;

            // Draw frames
            const drawFrame = () => {
                if (video.ended || video.paused) {
                    recorder.stop();
                    return;
                }

                // Draw video frame
                this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

                // Draw watermark
                if (options.trinibuildEnabled && this.trinibuildLogo) {
                    this.drawWatermark(
                        this.trinibuildLogo,
                        options.trinibuildPosition,
                        options.trinibuildOpacity
                    );
                }

                requestAnimationFrame(drawFrame);
            };

            recorder.start();
            drawFrame();
        });
    }

    private drawWatermark(
        logo: HTMLImageElement,
        position: string,
        opacity: number
    ): void {
        const logoSize = this.canvas.width * 0.15; // 15% of video width
        const margin = 24;
        const safeZoneHeight = this.canvas.height * 0.16; // Reserve bottom 16% for CTA

        let x = 0;
        let y = 0;

        switch (position) {
            case 'top_left':
                x = margin;
                y = margin;
                break;
            case 'top_right':
                x = this.canvas.width - logoSize - margin;
                y = margin;
                break;
            case 'bottom_left':
                x = margin;
                y = this.canvas.height - logoSize - margin - safeZoneHeight;
                break;
            case 'bottom_right':
            default:
                x = this.canvas.width - logoSize - margin;
                y = this.canvas.height - logoSize - margin - safeZoneHeight;
                break;
        }

        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(logo, x, y, logoSize, logoSize);
        this.ctx.globalAlpha = 1.0;
    }

    async generateThumbnail(videoFile: File, timeInSeconds: number = 0): Promise<string> {
        const video = await this.loadVideo(videoFile);
        video.currentTime = timeInSeconds;

        await new Promise(resolve => {
            video.onseeked = resolve;
        });

        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.ctx.drawImage(video, 0, 0);

        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    cleanup(): void {
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Factory function for easy use
export const createWatermarkEngine = () => new WatermarkEngine();

// Helper to check browser support
export const isWatermarkSupported = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        const stream = canvas.captureStream();
        return !!window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
    } catch {
        return false;
    }
};

// Estimate processing time based on video duration
export const estimateProcessingTime = (videoDurationSeconds: number): number => {
    // Rough estimate: ~2x real-time for client-side processing
    return videoDurationSeconds * 2;
};

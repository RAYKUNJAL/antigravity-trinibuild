# TriniBuild Ads Manager - Watermark Engine

## Overview

The Watermark Engine applies TriniBuild branding and optional vendor logos to all video ads, ensuring brand consistency while protecting content.

---

## Architecture

### Client-Side Processing (Lightweight)
- **Technology:** Canvas API + MediaRecorder
- **Use case:** Simple watermark overlays
- **Pros:** No server costs, immediate feedback
- **Cons:** Limited to browser capabilities, slower for large files

### Server-Side Processing (Recommended for Production)
- **Technology:** FFmpeg on serverless functions (Vercel/Cloudflare Workers)
- **Use case:** High-quality encoding, HLS streaming
- **Pros:** Professional quality, scalable
- **Cons:** Requires backend infrastructure

---

## Watermark Specifications

### TriniBuild Brand Watermark
- **Position:** Bottom-right by default
- **Size:** 15-20% of video width
- **Opacity:** 18% (semi-transparent)
- **Safe zone margin:** 24px from edges
- **Format:** PNG with transparency

### Vendor Logo Watermark (Optional)
- **Position:** Top-left, top-right, or bottom-left
- **Size:** Max 18% of video width
- **Opacity:** 26%
- **Precedence:** TriniBuild watermark always visible

### Safe Zones
- **Bottom bar reserved:** 16% of video height (for CTAs)
- **Watermarks must not obscure:** CTA buttons, captions

---

## Implementation Approaches

### Option 1: Client-Side with Canvas API
```typescript
// Simple overlay using HTML5 Canvas
const addWatermark = async (videoFile: File, watermarkImage: string) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Load video
    video.src = URL.createObjectURL(videoFile);
    await video.play();
    
    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame + watermark
    const drawFrame = () => {
        ctx.drawImage(video, 0, 0);
        
        // Draw watermark at bottom-right
        const logoSize = canvas.width * 0.2;
        ctx.globalAlpha = 0.18;
        ctx.drawImage(
            watermarkImg,
            canvas.width - logoSize - 24,
            canvas.height - logoSize - 24,
            logoSize,
            logoSize
        );
        ctx.globalAlpha = 1.0;
        
        requestAnimationFrame(drawFrame);
    };
    
    // Record canvas
    const stream = canvas.captureStream(30); // 30fps
    const recorder = new MediaRecorder(stream);
    // ... capture and save
};
```

**Pros:** Simple, no dependencies  
**Cons:** Limited format support, performance issues with long videos

---

### Option 2: FFmpeg.wasm (Client-Side, Better Quality)
```typescript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

const addWatermarkFFmpeg = async (videoFile: File, watermarkUrl: string) => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }
    
    // Write files to FFmpeg virtual filesystem
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
    ffmpeg.FS('writeFile', 'logo.png', await fetchFile(watermarkUrl));
    
    // Apply watermark with FFmpeg
    await ffmpeg.run(
        '-i', 'input.mp4',
        '-i', 'logo.png',
        '-filter_complex',
        `[1:v]scale=-1:100[logo];` +
        `[0:v][logo]overlay=W-w-24:H-h-24:format=auto,` +
        `format=yuv420p`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        'output.mp4'
    );
    
    // Read output
    const data = ffmpeg.FS('readFile', 'output.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
};
```

**Pros:** Professional quality, same as desktop FFmpeg  
**Cons:** ~30MB WASM bundle, slower first load

---

### Option 3: Server-Side Processing (Cloudflare Workers + FFmpeg)
```typescript
// API endpoint: /api/watermark
export async function POST(request: Request) {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    
    // Upload to temporary storage
    const videoUrl = await uploadToTemp(videoFile);
    
    // Process with FFmpeg on worker
    const watermarkedUrl = await processVideo(videoUrl, {
        trinibuildLogo: 'https://cdn.trinibuild.com/logo-watermark.png',
        vendorLogo: formData.get('vendorLogo'),
        position: 'bottom_right',
        opacity: 0.18
    });
    
    // Upload to CDN
    const finalUrl = await uploadToCDN(watermarkedUrl);
    
    return Response.json({ url: finalUrl });
}
```

**Pros:** Best quality, doesn't block client, scalable  
**Cons:** Requires backend, costs per processing minute

---

## Recommended Implementation Path

### Phase 1: MVP (Client-Side Canvas)
✅ Quick to implement  
✅ Works for short videos (<30s)  
✅ Immediate user feedback

### Phase 2: Enhanced (FFmpeg.wasm)
✅ Better quality  
✅ More format support  
✅ Still client-side

### Phase 3: Production (Server-Side)
✅ Professional quality  
✅ HLS adaptive streaming  
✅ CDN delivery  
✅ Scalable

---

## File Structure

```
services/
  watermarkEngine.ts          # Core watermarking logic
  videoUploadService.ts       # Upload to storage
components/ads/
  VideoWatermarkPreview.tsx   # Preview with watermark
  WatermarkConfig.tsx         # Configure watermark settings
api/
  watermark/
    route.ts                  # Server-side processing endpoint
```

---

## Storage & CDN

### Development
- **Supabase Storage** (`site-assets` bucket)
- Direct upload via client SDK

### Production
- **Cloudflare R2** or **AWS S3**
- **Cloudflare Stream** for HLS delivery
- CDN caching for fast delivery

---

## Watermark Assets

**Required Files:**
1. `public/watermarks/trinibuild-logo.png` (White, transparent BG, 512x512)
2. Vendor logos uploaded by advertisers

**Specifications:**
- Format: PNG with alpha channel
- Size: 512x512px minimum
- Background: Transparent
- Color: White or brand color

---

## Next Steps

1. **Create watermark PNG**  
   Design TriniBuild watermark logo
   
2. **Choose implementation**  
   Start with Canvas API for quick MVP
   
3. **Build preview component**  
   Show watermark placement before upload
   
4. **Integrate into wizard**  
   Add watermark step to campaign creation

5. **Test & iterate**  
   Ensure watermark doesn't obscure content

---

**Status:** Design complete, ready for implementation  
**Estimated time:** 2-3 days for MVP, 1 week for production-ready

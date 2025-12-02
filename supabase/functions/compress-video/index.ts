// Supabase Edge Function for video compression using FFmpeg
// Deploy this to: supabase/functions/compress-video/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const formData = await req.formData()
        const videoFile = formData.get('video') as File
        const options = JSON.parse(formData.get('options') as string || '{}')

        if (!videoFile) {
            throw new Error('No video file provided')
        }

        // Read video file
        const videoBuffer = await videoFile.arrayBuffer()
        const videoBytes = new Uint8Array(videoBuffer)

        // Write to temp file
        const inputPath = `/tmp/input_${Date.now()}.${videoFile.name.split('.').pop()}`
        const outputPath = `/tmp/output_${Date.now()}.${options.format || 'mp4'}`

        await Deno.writeFile(inputPath, videoBytes)

        // Build FFmpeg command
        const quality = options.quality || 'medium'
        const maxWidth = options.maxWidth || 1920
        const maxHeight = options.maxHeight || 1080

        const qualityPresets = {
            low: { crf: '28', preset: 'fast', bitrate: '500k' },
            medium: { crf: '23', preset: 'medium', bitrate: '1000k' },
            high: { crf: '20', preset: 'slow', bitrate: '2000k' },
            ultra: { crf: '18', preset: 'slower', bitrate: '4000k' }
        }

        const preset = qualityPresets[quality as keyof typeof qualityPresets] || qualityPresets.medium

        // FFmpeg compression command
        const ffmpegArgs = [
            '-i', inputPath,
            '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
            '-c:v', 'libx264',
            '-crf', preset.crf,
            '-preset', preset.preset,
            '-b:v', preset.bitrate,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart', // Enable streaming
            '-y', // Overwrite output
            outputPath
        ]

        // Run FFmpeg
        const process = Deno.run({
            cmd: ['ffmpeg', ...ffmpegArgs],
            stdout: 'piped',
            stderr: 'piped',
        })

        const status = await process.status()

        if (!status.success) {
            const error = new TextDecoder().decode(await process.stderrOutput())
            throw new Error(`FFmpeg failed: ${error}`)
        }

        // Read compressed video
        const compressedVideo = await Deno.readFile(outputPath)

        // Clean up temp files
        await Deno.remove(inputPath)
        await Deno.remove(outputPath)

        // Convert to base64 for response
        const base64 = btoa(String.fromCharCode(...compressedVideo))

        return new Response(
            JSON.stringify({
                compressed: base64,
                originalSize: videoBytes.length,
                compressedSize: compressedVideo.length,
                compressionRatio: ((videoBytes.length - compressedVideo.length) / videoBytes.length * 100).toFixed(2)
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

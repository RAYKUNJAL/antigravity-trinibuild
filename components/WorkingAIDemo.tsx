/**
 * Landing-page AI product scanner demo.
 * Compresses mobile photos in the browser, then sends the image to the secure
 * backend vision endpoint so provider keys and storage policies stay off the client.
 */
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkingAIDemo: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'compressing' | 'processing' | 'done' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Compress and convert ANY image to JPEG
   * Handles: HEIC, PNG, WebP, large files
   * Output: JPEG <800KB
   */
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if too large
          const MAX_SIZE = 1920;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (height / width) * MAX_SIZE;
              width = MAX_SIZE;
            } else {
              width = (width / height) * MAX_SIZE;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas error'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }

              // If still too large, compress more
              if (blob.size > 800 * 1024) {
                canvas.toBlob(
                  (secondBlob) => resolve(secondBlob || blob),
                  'image/jpeg',
                  0.6
                );
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            0.85
          );
        };

        img.onerror = () => reject(new Error('Invalid image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not prepare image for AI analysis'));
      reader.readAsDataURL(blob);
    });
  };

  const handleFile = async (file: File) => {
    try {
      setErrorMsg('');
      setProgress('Preparing...');

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image');
      }

      setPreview(URL.createObjectURL(file));
      setStatus('compressing');
      setProgress('Compressing...');

      const compressed = await compressImage(file);
      console.log(`Size: ${(file.size/1024/1024).toFixed(2)}MB → ${(compressed.size/1024).toFixed(0)}KB`);

      setStatus('processing');
      setProgress('AI analyzing...');
      const imageUrl = await blobToDataUrl(compressed);

      const aiRes = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt: `Analyze this product. Return ONLY JSON:
{"name": "Product name (max 80 chars)", "price": number (TTD), "category": "Category", "description": "2-3 paragraphs", "tags": ["tag1", "tag2", "tag3"]}`,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        })
      });

      if (!aiRes.ok) {
        const detail = await aiRes.json().catch(() => null);
        throw new Error(detail?.message || detail?.error || 'AI analysis failed');
      }

      const aiData = await aiRes.json();
      const content = aiData.content || aiData.analysis || '{}';
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const listing = JSON.parse(cleaned);

      setResult(listing);
      setStatus('done');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setResult(null);
    setErrorMsg('');
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-xs uppercase mb-4">
            <Sparkles className="w-4 h-4" /> LIVE AI
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            Upload Any Product Photo
          </h2>
          <p className="text-lg text-gray-600">
            AI creates listing in seconds
          </p>
        </div>

        {status === 'idle' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-4 px-8 py-12 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center">
                <Camera className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 mb-1">
                  Tap to upload or take photo
                </p>
                <p className="text-sm text-gray-500">
                  iPhone HEIC, JPEG, PNG • Any size
                </p>
              </div>
            </button>
          </>
        )}

        {(status === 'compressing' || status === 'processing') && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">{progress}</p>
            {preview && (
              <img src={preview} className="w-32 h-32 object-cover rounded-lg mx-auto mt-4 opacity-50" />
            )}
          </div>
        )}

        {status === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border shadow-xl overflow-hidden"
          >
            {preview && <img src={preview} className="w-full h-64 object-cover" />}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.name}</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-red-600">
                  TT${result.price?.toLocaleString() || '0'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{result.category}</span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                {result.description}
              </p>
              {result.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {result.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold"
                >
                  Try Another
                </button>
                <Link
                  to="/signup"
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-center"
                >
                  Create Store →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-900 font-semibold">Failed</p>
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

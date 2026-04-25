import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function DebugUpload() {
  const [logs, setLogs] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogs([]);
    log(`📁 File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    log(`📋 Type: ${file.type}`);

    try {
      // Step 1: Test image compression
      log('🔄 Step 1: Testing image compression...');
      const img = new Image();
      const imgBlob = await new Promise<Blob>((resolve, reject) => {
        img.onload = () => {
          log(`✅ Image loaded: ${img.width}x${img.height}px`);
          
          const canvas = document.createElement('canvas');
          const maxSize = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) reject(new Error('Canvas to blob failed'));
              else {
                log(`✅ Compressed to ${(blob.size / 1024).toFixed(2)} KB`);
                resolve(blob);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = URL.createObjectURL(file);
      });

      // Step 2: Test Supabase upload
      log('🔄 Step 2: Testing Supabase upload...');
      const fileName = `demo/test-${Date.now()}.jpg`;
      
      log(`📤 Uploading to: product-images/${fileName}`);
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, imgBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) {
        log(`❌ Upload error: ${error.message}`);
        throw error;
      }

      log(`✅ Upload successful!`);
      log(`📦 Data: ${JSON.stringify(data)}`);

      // Step 3: Get public URL
      log('🔄 Step 3: Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      log(`✅ Public URL: ${publicUrl}`);
      setImageUrl(publicUrl);

      // Step 4: Test Gemini API via backend proxy
      log('🔄 Step 4: Testing Gemini API (via backend)...');

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: publicUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        log(`❌ API error: ${response.status} - ${errorText}`);
        throw new Error(`API failed: ${response.status}`);
      }

      const aiData = await response.json();
      log(`✅ Gemini response: ${aiData.analysis}`);

      log('🎉 ALL TESTS PASSED!');

    } catch (error: any) {
      log(`❌ FATAL ERROR: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Upload Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block mb-4">
            <span className="text-lg font-semibold">Select an image to test:</span>
            <input
              type="file"
              accept="image/*"
              onChange={testUpload}
              className="block w-full mt-2 text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>

        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for file upload...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))
          )}
        </div>

        {imageUrl && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Uploaded Image:</h3>
            <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

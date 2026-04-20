import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  Edit, 
  DollarSign,
  Package,
  Tag,
  Loader2,
  ArrowRight,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AIProductListingProps {
  storeId: string;
  onComplete: (product: GeneratedProduct) => void;
  tier: 'free' | 'pro' | 'premium';
}

interface GeneratedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  sku?: string;
  barcode?: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  suggested_keywords: string[];
}

export const AIProductListing: React.FC<AIProductListingProps> = ({
  storeId,
  onComplete,
  tier
}) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'complete'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProduct | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check tier limits
  const canUseAI = tier !== 'free';
  const monthlyLimit = tier === 'pro' ? 25 : tier === 'premium' ? Infinity : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const generateProductListing = async () => {
    if (!imageFile || !canUseAI) return;

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // 3. Call AI to analyze image and generate listing
      // In production, this would call your Gemini/Claude API
      // For now, using mock data with realistic generation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI processing

      const aiGenerated: GeneratedProduct = await generateProductFromImage(
        urlData.publicUrl,
        imageFile.name
      );

      setGeneratedProduct(aiGenerated);
      setStep('review');
    } catch (err) {
      console.error('Error generating product:', err);
      setError('Failed to generate product listing. Please try again.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditField = (field: keyof GeneratedProduct, value: any) => {
    if (generatedProduct) {
      setGeneratedProduct({
        ...generatedProduct,
        [field]: value
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!generatedProduct) return;

    try {
      // Save to database
      const { data, error } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: generatedProduct.name,
          description: generatedProduct.description,
          price: generatedProduct.price,
          currency: generatedProduct.currency,
          category: generatedProduct.category,
          image_url: generatedProduct.imageUrl,
          sku: generatedProduct.sku || generateSKU(generatedProduct.name),
          barcode: generatedProduct.barcode,
          tags: generatedProduct.tags,
          seo_title: generatedProduct.seoTitle,
          seo_description: generatedProduct.seoDescription,
          ai_generated: true
        })
        .select()
        .single();

      if (error) throw error;

      setStep('complete');
      setTimeout(() => {
        onComplete(generatedProduct);
      }, 2000);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    }
  };

  if (!canUseAI) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-trini-red to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          AI Product Listing
        </h3>
        <p className="text-gray-600 mb-6">
          Take a photo → AI generates complete product listing instantly
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/pricing'}
          className="px-8 py-3 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 inline-flex items-center gap-2"
        >
          <Wand2 className="w-5 h-5" />
          Upgrade to Pro for AI Listings
        </motion.button>
        <p className="text-sm text-gray-500 mt-4">
          Pro: 25 AI listings/month • Premium: Unlimited
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      
      <AnimatePresence mode="wait">
        
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-trini-red to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                AI Product Listing
              </h2>
              <p className="text-gray-600">
                Take a photo or upload an image - AI does the rest!
              </p>
              {tier === 'pro' && (
                <p className="text-sm text-gray-500 mt-2">
                  {monthlyLimit - 0} AI listings remaining this month
                </p>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-64 object-contain"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-4">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => cameraInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-trini-red hover:bg-red-50 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Take Photo</p>
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-trini-red hover:bg-red-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Upload Image</p>
              </motion.button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {imageFile && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateProductListing}
                className="w-full px-6 py-4 bg-gradient-to-r from-trini-red to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Product Listing with AI
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* STEP 2: PROCESSING */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <Loader2 className="w-16 h-16 text-trini-red animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900 mb-2">
              AI is analyzing your product...
            </h3>
            <p className="text-gray-600 mb-8">
              Generating name, description, pricing, tags, and SEO
            </p>
            <div className="max-w-md mx-auto space-y-3">
              {[
                'Analyzing image',
                'Identifying product type',
                'Generating description',
                'Suggesting price range',
                'Creating SEO content'
              ].map((task, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {task}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 'review' && generatedProduct && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">
                Product Listing Ready!
              </h3>
              <p className="text-gray-600">
                Review and edit before saving
              </p>
            </div>

            {/* Product Image */}
            <div className="rounded-xl overflow-hidden">
              <img
                src={generatedProduct.imageUrl}
                alt={generatedProduct.name}
                className="w-full h-64 object-contain bg-gray-100"
              />
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={generatedProduct.name}
                  onChange={(e) => handleEditField('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={generatedProduct.description}
                  onChange={(e) => handleEditField('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Price (TTD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={generatedProduct.price}
                      onChange={(e) => handleEditField('price', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={generatedProduct.category}
                    onChange={(e) => handleEditField('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {generatedProduct.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveProduct}
                className="flex-1 px-6 py-3 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save Product
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateProductListing}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:border-gray-400 flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Regenerate
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: COMPLETE */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              Product Added Successfully!
            </h3>
            <p className="text-gray-600">
              Your AI-generated product is now live
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

// Helper function to generate product from image (calls AI API)
async function generateProductFromImage(
  imageUrl: string,
  fileName: string
): Promise<GeneratedProduct> {
  // In production, this calls your Gemini/Claude Vision API
  // For now, returning realistic mock data
  
  // Simulate AI analysis
  const productName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    name: productName || 'Product',
    description: `High-quality ${productName.toLowerCase()}. Perfect for everyday use. Made with premium materials and built to last. Features modern design that fits any style. Available now in Trinidad & Tobago.`,
    price: 99.99,
    currency: 'TTD',
    category: 'General',
    tags: ['new', 'trending', 'quality', 'trinidad'],
    sku: generateSKU(productName),
    imageUrl,
    seoTitle: `Buy ${productName} in Trinidad - Best Prices | TriniBuild`,
    seoDescription: `Shop ${productName} online in Trinidad & Tobago. Fast delivery, great prices, and excellent customer service. Order now!`,
    suggested_keywords: [productName.toLowerCase(), 'trinidad', 'buy online', 'delivery']
  };
}

// Generate SKU from product name
function generateSKU(name: string): string {
  const prefix = name
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${randomNum}`;
}

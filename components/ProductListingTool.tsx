'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Upload,
  FileSpreadsheet,
  Camera,
  Zap,
  Check,
  X,
  Sparkles,
  DollarSign,
  Package,
  Image as ImageIcon,
  MessageSquare,
  Download,
  AlertCircle,
} from 'lucide-react';

interface ProductListingToolProps {
  storeId: string;
}

export default function ProductListingTool({ storeId }: ProductListingToolProps) {
  const [method, setMethod] = useState<'manual' | 'csv' | 'mobile' | 'whatsapp' | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    inventory: '',
    images: [] as string[],
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleCSVUpload = async (file: File) => {
    setLoading(true);
    setProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsedProducts = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const product: any = {
          name: '',
          description: '',
          price: 0,
          inventory: 0,
        };
        
        headers.forEach((header, index) => {
          if (header === 'name' || header === 'product name' || header === 'title') {
            product.name = values[index];
          } else if (header === 'description' || header === 'desc') {
            product.description = values[index];
          } else if (header === 'price') {
            product.price = parseFloat(values[index].replace(/[^0-9.]/g, ''));
          } else if (header === 'inventory' || header === 'stock' || header === 'quantity') {
            product.inventory = parseInt(values[index]);
          } else if (header === 'sku') {
            product.sku = values[index];
          } else if (header === 'image' || header === 'image_url') {
            product.image_url = values[index];
          }
        });
        
        if (product.name && product.price) {
          parsedProducts.push(product);
        }
        
        setProgress(Math.round((i / lines.length) * 100));
      }

      setProducts(parsedProducts);
      setProgress(100);
    } catch (error) {
      console.error('CSV parsing error:', error);
      alert('Failed to parse CSV. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const optimizedImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Resize to max 1200px width while maintaining aspect ratio
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = await new Promise<string>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.85);
      });
      
      optimizedImages.push(dataUrl);
    }
    
    setCurrentProduct(prev => ({
      ...prev,
      images: [...prev.images, ...optimizedImages],
    }));
  };

  const handleSaveProducts = async () => {
    setLoading(true);
    
    try {
      const productsToInsert = products.length > 0 ? products : [currentProduct];
      
      for (const product of productsToInsert) {
        // Upload images to Supabase Storage
        const imageUrls = [];
        
        for (const imageData of product.images || []) {
          const blob = await fetch(imageData).then(r => r.blob());
          const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, blob);
          
          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(uploadData.path);
            
            imageUrls.push(publicUrl);
          }
        }
        
        // Insert product
        const { error: productError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price || '0'),
            compare_at_price: product.comparePrice ? parseFloat(product.comparePrice) : null,
            sku: product.sku,
            inventory_quantity: parseInt(product.inventory || '0'),
            images: imageUrls,
            is_active: true,
          });
        
        if (productError) throw productError;
      }
      
      alert(`Successfully added ${productsToInsert.length} product(s)!`);
      
      // Reset
      setProducts([]);
      setCurrentProduct({
        name: '',
        description: '',
        price: '',
        comparePrice: '',
        sku: '',
        inventory: '',
        images: [],
      });
      setMethod(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const template = `name,description,price,compare_price,sku,inventory,image_url
"Trinidad Doubles","Traditional Trini breakfast - two baras with channa",25.00,30.00,FOOD-001,100,https://example.com/doubles.jpg
"Maracas Bay T-Shirt","Premium cotton tee with Maracas Bay print",150.00,200.00,TSHIRT-001,50,https://example.com/tshirt.jpg
"Local Hot Sauce","Handmade pepper sauce - medium heat",45.00,,SAUCE-001,200,https://example.com/sauce.jpg`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trinibuild-product-template.csv';
    a.click();
  };

  if (!method) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black font-inter mb-3 bg-gradient-to-r from-trini-red to-red-700 bg-clip-text text-transparent">
              List Your Products
            </h1>
            <p className="text-gray-600 font-inter text-lg">
              Choose the fastest way to get your products online
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CSV Import */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setMethod('csv')}
            className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-trini-red transition-all text-left group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black font-inter mb-2">Bulk CSV Import</h3>
            <p className="text-gray-600 font-inter text-sm mb-4">
              Upload 100+ products at once from Excel or Google Sheets
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-trini-red">
              <Zap className="w-4 h-4" />
              <span>Fastest for large catalogs</span>
            </div>
          </motion.button>

          {/* Mobile Photo */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setMethod('mobile')}
            className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-trini-red transition-all text-left group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black font-inter mb-2">Mobile Photo</h3>
            <p className="text-gray-600 font-inter text-sm mb-4">
              Snap photos with your phone and add details instantly
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-green-600">
              <Check className="w-4 h-4" />
              <span>Perfect for physical stores</span>
            </div>
          </motion.button>

          {/* WhatsApp Quick Add */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setMethod('whatsapp')}
            className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-trini-red transition-all text-left group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black font-inter mb-2">WhatsApp Add</h3>
            <p className="text-gray-600 font-inter text-sm mb-4">
              Send product photos via WhatsApp and we'll add them
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered</span>
            </div>
          </motion.button>

          {/* Manual Entry */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setMethod('manual')}
            className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-trini-red transition-all text-left group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black font-inter mb-2">Manual Entry</h3>
            <p className="text-gray-600 font-inter text-sm mb-4">
              Add products one at a time with full control
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-purple-600">
              <Check className="w-4 h-4" />
              <span>Best for few products</span>
            </div>
          </motion.button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-trini-red/10 to-transparent rounded-2xl p-6"
        >
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-black font-inter text-trini-red mb-1">2.5 min</div>
              <div className="text-sm text-gray-600 font-inter">Average time per product</div>
            </div>
            <div>
              <div className="text-3xl font-black font-inter text-trini-red mb-1">84%</div>
              <div className="text-sm text-gray-600 font-inter">Complete their listings</div>
            </div>
            <div>
              <div className="text-3xl font-black font-inter text-trini-red mb-1">3.2x</div>
              <div className="text-sm text-gray-600 font-inter">Faster than competitors</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => setMethod(null)}
        className="mb-6 text-gray-600 hover:text-gray-900 font-inter font-bold flex items-center gap-2"
      >
        ← Back to methods
      </button>

      <AnimatePresence mode="wait">
        {/* CSV Import Flow */}
        {method === 'csv' && (
          <motion.div
            key="csv"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-3xl font-black font-inter mb-6">Bulk CSV Import</h2>

            {products.length === 0 ? (
              <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black font-inter mb-2">First time? Download our template</h3>
                      <p className="text-sm text-gray-600 font-inter mb-4">
                        Get a pre-formatted CSV with examples. Fill it out in Excel or Google Sheets.
                      </p>
                      <button
                        onClick={downloadCSVTemplate}
                        className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold font-inter hover:bg-blue-600 transition-colors"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-trini-red cursor-pointer transition-colors bg-gray-50"
                >
                  <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black font-inter mb-2">Upload Your CSV File</h3>
                  <p className="text-gray-600 font-inter">
                    Click to browse or drag and drop your file here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleCSVUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Format Info */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-bold font-inter mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-trini-red" />
                    Required CSV Format
                  </h4>
                  <div className="text-sm text-gray-600 font-inter space-y-1">
                    <p>• <strong>name</strong> - Product name (required)</p>
                    <p>• <strong>price</strong> - Price in TTD (required)</p>
                    <p>• <strong>description</strong> - Product description</p>
                    <p>• <strong>inventory</strong> - Stock quantity</p>
                    <p>• <strong>sku</strong> - Product SKU/code</p>
                    <p>• <strong>image_url</strong> - Product image URL</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Check className="w-6 h-6 text-green-600" />
                    <h3 className="font-black font-inter text-green-900">
                      {products.length} Products Ready
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 font-inter">
                    Review your products below and click "Add All Products" when ready.
                  </p>
                </div>

                {/* Product Preview */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {products.map((product, i) => (
                    <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold font-inter">{product.name}</h4>
                        <p className="text-sm text-gray-600 font-inter">{product.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-inter text-trini-red">${product.price}</div>
                        <div className="text-xs text-gray-500 font-inter">Stock: {product.inventory || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveProducts}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-trini-red to-red-700 text-white px-8 py-4 rounded-full font-black text-lg font-inter hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding Products...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Add All {products.length} Products</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual Entry Flow */}
        {method === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-black font-inter mb-6">Add Product Manually</h2>

            {/* Image Upload */}
            <div>
              <label className="block font-bold font-inter mb-3">Product Photos</label>
              <div className="grid grid-cols-4 gap-4">
                {currentProduct.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setCurrentProduct(prev => ({
                        ...prev,
                        images: prev.images.filter((_, idx) => idx !== i)
                      }))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-square rounded-xl border-4 border-dashed border-gray-300 flex items-center justify-center hover:border-trini-red transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold font-inter mb-2">Product Name *</label>
                <input
                  type="text"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="e.g., Trinidad Doubles"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">SKU (Optional)</label>
                <input
                  type="text"
                  value={currentProduct.sku}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                  placeholder="e.g., FOOD-001"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Price (TTD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={currentProduct.price}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                    placeholder="25.00"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Compare At Price (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={currentProduct.comparePrice}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, comparePrice: e.target.value })}
                    placeholder="30.00"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Inventory</label>
                <input
                  type="number"
                  value={currentProduct.inventory}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, inventory: e.target.value })}
                  placeholder="100"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold font-inter mb-2">Description</label>
              <textarea
                value={currentProduct.description}
                onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                placeholder="Describe your product..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter resize-none"
              />
            </div>

            <button
              onClick={() => {
                setProducts([currentProduct]);
                handleSaveProducts();
              }}
              disabled={!currentProduct.name || !currentProduct.price || loading}
              className="w-full bg-gradient-to-r from-trini-red to-red-700 text-white px-8 py-4 rounded-full font-black text-lg font-inter hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* WhatsApp Flow */}
        {method === 'whatsapp' && (
          <motion.div
            key="whatsapp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-12 text-white mb-6">
              <MessageSquare className="w-20 h-20 mx-auto mb-6" />
              <h2 className="text-3xl font-black font-inter mb-4">WhatsApp Product Listing</h2>
              <p className="text-xl font-inter mb-8 text-white/90">
                Send product photos via WhatsApp and our AI will add them to your store
              </p>

              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mb-8 text-left">
                <h3 className="font-black font-inter mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  How it works:
                </h3>
                <ol className="space-y-3 text-white/90 font-inter">
                  <li>1. Take photos of your products</li>
                  <li>2. Send them to our WhatsApp number</li>
                  <li>3. Our AI reads the images and creates listings</li>
                  <li>4. You review and approve</li>
                </ol>
              </div>

              <a
                href="https://wa.me/18683012345?text=I want to add products to my TriniBuild store"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-green-600 px-8 py-4 rounded-full font-black text-lg font-inter hover:bg-green-50 transition-all"
              >
                <MessageSquare className="w-6 h-6" />
                <span>Open WhatsApp</span>
              </a>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-bold font-inter mb-1">Coming Soon!</h4>
                  <p className="text-sm text-gray-600 font-inter">
                    WhatsApp product listing is launching next week. For now, use CSV import or manual entry.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

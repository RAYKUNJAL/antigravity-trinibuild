import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Palette, Type, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TEMPLATE CUSTOMIZATION UI
 * Allows merchants to personalize their chosen template:
 * - Color scheme (primary, secondary, accent)
 * - Typography (heading font, body font)
 * - Branding (logo, store name, tagline)
 * - Preview in real-time
 */

export interface TemplateCustomization {
  storeName: string;
  tagline: string;
  logo?: string;
  colors: {
    primary: string;      // Main brand color
    secondary: string;    // Secondary color
    accent: string;       // Highlight color
  };
  fonts: {
    heading: string;      // 'Inter' | 'Playfair' | 'Poppins'
    body: string;         // 'Inter' | 'Lato' | 'Open Sans'
  };
}

export const TemplateCustomizer: React.FC<{
  templateId: string;
  onSave: (customization: TemplateCustomization) => void;
}> = ({ templateId, onSave }) => {
  const [customization, setCustomization] = useState<TemplateCustomization>({
    storeName: 'My Store',
    tagline: 'Welcome to our store',
    colors: {
      primary: '#E61E2B',     // Trinidad red default
      secondary: '#000000',   // Black
      accent: '#FFD700'       // Gold
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  });

  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'fonts'>('branding');
  const [previewOpen, setPreviewOpen] = useState(false);

  const headingFonts = [
    { id: 'Inter', name: 'Inter', preview: 'font-sans' },
    { id: 'Playfair', name: 'Playfair Display', preview: 'font-serif' },
    { id: 'Poppins', name: 'Poppins', preview: 'font-bold' }
  ];

  const bodyFonts = [
    { id: 'Inter', name: 'Inter', preview: 'font-sans' },
    { id: 'Lato', name: 'Lato', preview: 'font-light' },
    { id: 'Open Sans', name: 'Open Sans', preview: 'font-normal' }
  ];

  const colorPresets = [
    { name: 'Trinidad Red', primary: '#E61E2B', secondary: '#000000', accent: '#FFD700' },
    { name: 'Ocean Blue', primary: '#0066CC', secondary: '#003366', accent: '#00CCFF' },
    { name: 'Forest Green', primary: '#228B22', secondary: '#1a5c1a', accent: '#90EE90' },
    { name: 'Sunset Orange', primary: '#FF6B35', secondary: '#2C2C2C', accent: '#FFD700' },
    { name: 'Purple Luxury', primary: '#8B4789', secondary: '#2C2C2C', accent: '#E6B8FF' },
    { name: 'Rose Gold', primary: '#B76E79', secondary: '#3E3E3E', accent: '#F0E68C' }
  ];

  const handleCopyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    setCustomization({
      storeName: 'My Store',
      tagline: 'Welcome to our store',
      colors: {
        primary: '#E61E2B',
        secondary: '#000000',
        accent: '#FFD700'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    });
  };

  const handleSave = () => {
    onSave(customization);
    // Show success feedback
    alert('✅ Template customization saved!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-light mb-2">Customize Your Store</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Personalize your store template with your brand colors, fonts, and information
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Customization Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-800">
              {['branding', 'colors', 'fonts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-4 py-2 font-light text-sm uppercase tracking-wider border-b-2 transition ${
                    activeTab === tab
                      ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'branding' && <Settings className="inline w-4 h-4 mr-2" />}
                  {tab === 'colors' && <Palette className="inline w-4 h-4 mr-2" />}
                  {tab === 'fonts' && <Type className="inline w-4 h-4 mr-2" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-light uppercase tracking-wider mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={customization.storeName}
                    onChange={(e) =>
                      setCustomization({
                        ...customization,
                        storeName: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-lg"
                    placeholder="Enter your store name"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This appears in your store header and branding
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-light uppercase tracking-wider mb-2">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={customization.tagline}
                    onChange={(e) =>
                      setCustomization({
                        ...customization,
                        tagline: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                    placeholder="Enter your store tagline"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Appears on hero section and home page
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-light uppercase tracking-wider mb-2">
                    Logo Upload
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-slate-600 transition cursor-pointer">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-sm font-light">
                      Click to upload your store logo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, SVG (max 2MB)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COLORS TAB */}
            {activeTab === 'colors' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Color Presets */}
                <div>
                  <h3 className="text-sm font-light uppercase tracking-wider mb-3">
                    Color Presets
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          setCustomization({
                            ...customization,
                            colors: {
                              primary: preset.primary,
                              secondary: preset.secondary,
                              accent: preset.accent
                            }
                          })
                        }
                        className="p-3 border-2 border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-400 dark:hover:border-slate-600 transition text-left"
                      >
                        <div className="flex gap-1.5 mb-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: preset.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <p className="text-xs font-light">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                  <h3 className="text-sm font-light uppercase tracking-wider mb-4">
                    Custom Colors
                  </h3>

                  <div className="space-y-4">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider mb-2">
                        Primary Color (Main Brand)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={customization.colors.primary}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                primary: e.target.value
                              }
                            })
                          }
                          className="w-16 h-12 rounded cursor-pointer border-2 border-gray-300"
                        />
                        <input
                          type="text"
                          value={customization.colors.primary}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                primary: e.target.value
                              }
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-sm font-mono"
                        />
                        <button
                          onClick={() =>
                            handleCopyToClipboard(customization.colors.primary, 'primary')
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                        >
                          {copied === 'primary' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider mb-2">
                        Secondary Color (Backgrounds)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={customization.colors.secondary}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                secondary: e.target.value
                              }
                            })
                          }
                          className="w-16 h-12 rounded cursor-pointer border-2 border-gray-300"
                        />
                        <input
                          type="text"
                          value={customization.colors.secondary}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                secondary: e.target.value
                              }
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-sm font-mono"
                        />
                        <button
                          onClick={() =>
                            handleCopyToClipboard(customization.colors.secondary, 'secondary')
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                        >
                          {copied === 'secondary' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-xs font-light uppercase tracking-wider mb-2">
                        Accent Color (Highlights)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={customization.colors.accent}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                accent: e.target.value
                              }
                            })
                          }
                          className="w-16 h-12 rounded cursor-pointer border-2 border-gray-300"
                        />
                        <input
                          type="text"
                          value={customization.colors.accent}
                          onChange={(e) =>
                            setCustomization({
                              ...customization,
                              colors: {
                                ...customization.colors,
                                accent: e.target.value
                              }
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-sm font-mono"
                        />
                        <button
                          onClick={() =>
                            handleCopyToClipboard(customization.colors.accent, 'accent')
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                        >
                          {copied === 'accent' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FONTS TAB */}
            {activeTab === 'fonts' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-light uppercase tracking-wider mb-3">
                    Heading Font
                  </label>
                  <div className="space-y-2">
                    {headingFonts.map((font) => (
                      <button
                        key={font.id}
                        onClick={() =>
                          setCustomization({
                            ...customization,
                            fonts: {
                              ...customization.fonts,
                              heading: font.id
                            }
                          })
                        }
                        className={`w-full p-4 text-left border-2 rounded-lg transition ${
                          customization.fonts.heading === font.id
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-slate-800'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <h3 className={`text-2xl font-light mb-1 ${font.preview}`}>
                          {font.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Used for headings and titles
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light uppercase tracking-wider mb-3">
                    Body Font
                  </label>
                  <div className="space-y-2">
                    {bodyFonts.map((font) => (
                      <button
                        key={font.id}
                        onClick={() =>
                          setCustomization({
                            ...customization,
                            fonts: {
                              ...customization.fonts,
                              body: font.id
                            }
                          })
                        }
                        className={`w-full p-4 text-left border-2 rounded-lg transition ${
                          customization.fonts.body === font.id
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-slate-800'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <h3 className={`text-lg font-light mb-1 ${font.preview}`}>
                          {font.name}
                        </h3>
                        <p className={`text-sm text-gray-600 dark:text-gray-400 ${font.preview}`}>
                          Used for body text and descriptions
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>

              <button
                onClick={handleSave}
                className="ml-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-light tracking-wider uppercase text-sm"
              >
                Save Customization
              </button>
            </div>
          </motion.div>

          {/* RIGHT: Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8">
              <h3 className="text-sm font-light uppercase tracking-wider mb-4">
                Live Preview
              </h3>

              {/* Preview Box */}
              <div
                className="rounded-lg overflow-hidden shadow-xl"
                style={{
                  backgroundColor: customization.colors.secondary,
                  color: 'white'
                }}
              >
                {/* Preview Header */}
                <div className="p-6 border-b-2" style={{ borderColor: customization.colors.accent }}>
                  <h2
                    className="text-2xl font-light mb-2"
                    style={{ fontFamily: customization.fonts.heading }}
                  >
                    {customization.storeName}
                  </h2>
                  <p
                    className="text-sm opacity-90"
                    style={{ fontFamily: customization.fonts.body }}
                  >
                    {customization.tagline}
                  </p>
                </div>

                {/* Preview Content */}
                <div className="p-6">
                  <button
                    style={{ backgroundColor: customization.colors.primary }}
                    className="w-full py-3 rounded text-white font-light uppercase text-sm tracking-wider mb-4 hover:opacity-90 transition"
                  >
                    Call to Action
                  </button>

                  <div className="space-y-3">
                    <div
                      className="p-3 rounded"
                      style={{
                        backgroundColor: customization.colors.secondary,
                        borderLeft: `4px solid ${customization.colors.accent}`
                      }}
                    >
                      <p
                        className="text-xs opacity-80"
                        style={{ fontFamily: customization.fonts.body }}
                      >
                        Sample text in your chosen font
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded"
                        style={{ backgroundColor: customization.colors.primary }}
                      />
                      <div
                        className="w-12 h-12 rounded"
                        style={{ backgroundColor: customization.colors.accent }}
                      />
                      <div
                        className="w-12 h-12 rounded"
                        style={{ backgroundColor: customization.colors.secondary }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 This is a preview of your color and font choices. Your actual store will render fully with all template features.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;

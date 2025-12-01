import React, { useState } from 'react';
import { Palette, Check, Layout, Type } from 'lucide-react';
import { Theme } from '../types';

interface ThemeGeneratorProps {
    businessName: string;
    logoUrl?: string;
    onSelect: (theme: Partial<Theme>) => void;
}

const THEME_PRESETS = [
    {
        name: 'Minimal Clean',
        tokens: {
            colors: {
                primary: '#1a1a1a',
                secondary: '#f5f5f5',
                accent: '#3b82f6',
                background: '#ffffff',
                text_primary: '#111827',
            },
            typography: {
                font_family: 'Inter, sans-serif',
                heading_scale: 1.2,
            },
            layout: {
                card_radius: '0.5rem',
            }
        }
    },
    {
        name: 'Bold & Colorful',
        tokens: {
            colors: {
                primary: '#CE1126', // Trini Red
                secondary: '#000000',
                accent: '#FCD116',
                background: '#fff1f2',
                text_primary: '#000000',
            },
            typography: {
                font_family: 'Poppins, sans-serif',
                heading_scale: 1.4,
            },
            layout: {
                card_radius: '1rem',
            }
        }
    },
    {
        name: 'Luxury & Elegant',
        tokens: {
            colors: {
                primary: '#000000',
                secondary: '#1c1c1c',
                accent: '#d4af37', // Gold
                background: '#0a0a0a',
                text_primary: '#ffffff',
            },
            typography: {
                font_family: 'Playfair Display, serif',
                heading_scale: 1.3,
            },
            layout: {
                card_radius: '0px',
            }
        }
    },
    {
        name: 'Nature & Fresh',
        tokens: {
            colors: {
                primary: '#059669',
                secondary: '#ecfdf5',
                accent: '#f59e0b',
                background: '#ffffff',
                text_primary: '#064e3b',
            },
            typography: {
                font_family: 'Outfit, sans-serif',
                heading_scale: 1.25,
            },
            layout: {
                card_radius: '0.75rem',
            }
        }
    }
];

export const ThemeGenerator: React.FC<ThemeGeneratorProps> = ({ businessName, logoUrl, onSelect }) => {
    const [selectedPreset, setSelectedPreset] = useState<number>(0);

    const handleSelect = (idx: number) => {
        setSelectedPreset(idx);
        onSelect(THEME_PRESETS[idx]);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">Choose Your Store Theme</h2>
                <p className="text-gray-600 mt-2">Select a look that matches your brand vibe.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {THEME_PRESETS.map((preset, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={`cursor-pointer rounded-xl border-2 transition-all overflow-hidden group ${selectedPreset === idx ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        {/* Theme Preview Mini-Card */}
                        <div
                            className="h-32 p-4 flex flex-col justify-center items-center relative"
                            style={{ backgroundColor: preset.tokens.colors.background }}
                        >
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{
                                    color: preset.tokens.colors.text_primary,
                                    fontFamily: preset.tokens.typography.font_family
                                }}
                            >
                                {businessName || 'Your Store'}
                            </h3>
                            <button
                                className="px-4 py-1.5 rounded text-sm font-medium"
                                style={{
                                    backgroundColor: preset.tokens.colors.primary,
                                    color: '#fff',
                                    borderRadius: preset.tokens.layout.card_radius
                                }}
                            >
                                Shop Now
                            </button>

                            {selectedPreset === idx && (
                                <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">{preset.name}</span>
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: preset.tokens.colors.primary }}></div>
                                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: preset.tokens.colors.accent }}></div>
                                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: preset.tokens.colors.background }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => onSelect(THEME_PRESETS[selectedPreset])}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                    Continue with {THEME_PRESETS[selectedPreset].name}
                </button>
            </div>
        </div>
    );
};

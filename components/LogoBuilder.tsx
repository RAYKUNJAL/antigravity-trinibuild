import React, { useState } from 'react';
import { Wand2, RefreshCw, Download, Check, Loader2 } from 'lucide-react';
import { generateStoreLogo } from '../services/geminiService';

interface LogoBuilderProps {
    businessName: string;
    businessType: string;
    onSelect: (logoUrl: string) => void;
    onSkip: () => void;
}

export const LogoBuilder: React.FC<LogoBuilderProps> = ({ businessName, businessType, onSelect, onSkip }) => {
    const [loading, setLoading] = useState(false);
    const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
    const [style, setStyle] = useState('Minimalist');

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Generate 3 variations
            const styles = [style, 'Modern', 'Elegant'];
            const promises = styles.map(s => generateStoreLogo(businessName, `${businessType} ${s}`));
            const results = await Promise.all(promises);
            setGeneratedLogos(results);
        } catch (error) {
            console.error("Logo generation failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">Let's Design Your Logo</h2>
                <p className="text-gray-600 mt-2">Our AI will create a unique brand identity for {businessName}.</p>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Style</label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {['Minimalist', 'Bold', 'Vintage', 'Luxury', 'Playful'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStyle(s)}
                            className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${style === s
                                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {generatedLogos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {generatedLogos.map((logo, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedLogo(logo)}
                            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedLogo === logo ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'
                                }`}
                        >
                            <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                                <img src={logo} alt={`Logo option ${idx + 1}`} className="max-w-full max-h-full object-contain" />
                            </div>
                            {selectedLogo === logo && (
                                <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center mb-8">
                    <p className="text-gray-500">Select a style and click generate to see options.</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-70"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Wand2 className="h-5 w-5 mr-2" />}
                    {generatedLogos.length > 0 ? 'Regenerate' : 'Generate Logos'}
                </button>

                {generatedLogos.length > 0 && (
                    <button
                        onClick={() => selectedLogo && onSelect(selectedLogo)}
                        disabled={!selectedLogo}
                        className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Use Selected Logo
                    </button>
                )}

                <button
                    onClick={onSkip}
                    className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700"
                >
                    Skip for Now
                </button>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import {
    X, ChevronRight, ChevronLeft, Target, MapPin, Calendar,
    DollarSign, Video, Upload, Sparkles, Eye, Check, Loader2
} from 'lucide-react';
import { type AdCampaign } from '../../services/adsManagerService';
import { scriptWriter, captionGenerator, budgetRecommender } from '../../services/adsAIService';
import { AVAILABLE_PAGES, PAGE_SECTIONS } from '../../services/videoService';

interface CampaignWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (campaign: Partial<AdCampaign>) => Promise<void>;
    advertiserId: string;
}

type WizardStep = 'objective' | 'targeting' | 'budget' | 'video' | 'ai-assist' | 'preview' | 'review';

const OBJECTIVES = [
    { id: 'views', label: 'Video Views', icon: Eye, desc: 'Maximize how many people watch your video', color: 'blue' },
    { id: 'calls', label: 'Phone Calls', icon: '📞', desc: 'Drive calls to your business', color: 'green' },
    { id: 'messages', label: 'Messages', icon: '💬', desc: 'Get customers to message you', color: 'purple' },
    { id: 'profile_visits', label: 'Profile Visits', icon: '👤', desc: 'Increase store profile views', color: 'orange' },
    { id: 'website_clicks', label: 'Website Clicks', icon: '🌐', desc: 'Drive traffic to your website', color: 'pink' },
];

const LOCATIONS = [
    'Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Point Fortin',
    'Princes Town', 'Diego Martin', 'Penal-Debe', 'Couva', 'Tobago'
];

export function CampaignWizard({ isOpen, onClose, onSave, advertiserId }: CampaignWizardProps) {
    const [currentStep, setCurrentStep] = useState<WizardStep>('objective');
    const [campaignData, setCampaignData] = useState<Partial<AdCampaign>>({
        advertiser_id: advertiserId,
        name: '',
        objective: 'views',
        status: 'draft',
        target_locations: [],
        target_categories: [],
        daily_budget_ttd: 150,
        lifetime_budget_ttd: 2100,
        start_date: new Date().toISOString().split('T')[0],
    });

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // AI states
    const [generatingScript, setGeneratingScript] = useState(false);
    const [generatedScripts, setGeneratedScripts] = useState<string[]>([]);
    const [generatingCaption, setGeneratingCaption] = useState(false);
    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [selectedScript, setSelectedScript] = useState<string>('');
    const [selectedCaption, setSelectedCaption] = useState<string>('');

    const steps: { id: WizardStep; label: string }[] = [
        { id: 'objective', label: 'Objective' },
        { id: 'targeting', label: 'Targeting' },
        { id: 'budget', label: 'Budget' },
        { id: 'video', label: 'Video' },
        { id: 'ai-assist', label: 'AI Assist' },
        { id: 'preview', label: 'Preview' },
        { id: 'review', label: 'Review' },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStep(steps[currentStepIndex + 1].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(steps[currentStepIndex - 1].id);
        }
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerateScript = async () => {
        if (!campaignData.name) return;

        setGeneratingScript(true);
        try {
            const scripts = await scriptWriter.generate({
                business_description: campaignData.name,
                offer_details: 'Special promotion',
                tone: 'energetic',
                target_location: campaignData.target_locations?.[0] || 'Trinidad',
                duration_seconds: 20
            });
            setGeneratedScripts(scripts);
        } catch (error) {
            console.error('Failed to generate scripts:', error);
        } finally {
            setGeneratingScript(false);
        }
    };

    const handleGenerateCaption = async () => {
        setGeneratingCaption(true);
        try {
            const captions = await captionGenerator.generate({
                business_name: campaignData.name || 'My Business',
                offer: 'Special offer',
                video_context: selectedScript || 'Video ad',
                target_audience: 'Trinidad & Tobago'
            });
            setGeneratedCaptions(captions);
        } catch (error) {
            console.error('Failed to generate captions:', error);
        } finally {
            setGeneratingCaption(false);
        }
    };

    const handleSave = async () => {
        await onSave(campaignData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#101320] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#1E2235] flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Campaign</h2>
                        <p className="text-sm text-[#A9B0C3] mt-1">
                            Step {currentStepIndex + 1} of {steps.length}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#A9B0C3] hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4 bg-[#0B0D14]">
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className={`flex-1 h-2 rounded-full transition-all ${index <= currentStepIndex ? 'bg-[#00B894]' : 'bg-[#1E2235]'
                                    }`} />
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Objective */}
                    {currentStep === 'objective' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">What's your campaign goal?</h3>
                                <p className="text-[#A9B0C3]">Choose the primary action you want people to take</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white mb-3">Campaign Name</label>
                                <input
                                    type="text"
                                    value={campaignData.name}
                                    onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                                    placeholder="e.g., Summer Sale 2024"
                                    className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-[#00B894] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {OBJECTIVES.map((obj) => (
                                    <button
                                        key={obj.id}
                                        onClick={() => setCampaignData({ ...campaignData, objective: obj.id as any })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${campaignData.objective === obj.id
                                            ? 'border-[#00B894] bg-[#00B894]/10'
                                            : 'border-[#1E2235] hover:border-[#2A2F47]'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`text-3xl ${campaignData.objective === obj.id ? 'scale-110' : ''} transition-transform`}>
                                                {typeof obj.icon === 'string' ? obj.icon : <obj.icon className="h-8 w-8 text-[#00B894]" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white mb-1">{obj.label}</h4>
                                                <p className="text-xs text-[#A9B0C3]">{obj.desc}</p>
                                            </div>
                                            {campaignData.objective === obj.id && (
                                                <Check className="h-5 w-5 text-[#00B894]" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Targeting */}
                    {currentStep === 'targeting' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Who do you want to reach?</h3>
                                <p className="text-[#A9B0C3]">Select target locations across Trinidad & Tobago</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white mb-3">
                                    Target Locations ({campaignData.target_locations?.length || 0} selected)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {LOCATIONS.map((location) => {
                                        const isSelected = campaignData.target_locations?.includes(location);
                                        return (
                                            <button
                                                key={location}
                                                onClick={() => {
                                                    const current = campaignData.target_locations || [];
                                                    setCampaignData({
                                                        ...campaignData,
                                                        target_locations: isSelected
                                                            ? current.filter(l => l !== location)
                                                            : [...current, location]
                                                    });
                                                }}
                                                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${isSelected
                                                    ? 'border-[#00B894] bg-[#00B894]/10 text-white'
                                                    : 'border-[#1E2235] text-[#A9B0C3] hover:border-[#2A2F47]'
                                                    }`}
                                            >
                                                <MapPin className="h-4 w-4 inline mr-2" />
                                                {location}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Budget */}
                    {currentStep === 'budget' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Set your budget</h3>
                                <p className="text-[#A9B0C3]">Control how much you spend on this campaign</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        Daily Budget (TTD)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A9B0C3]" />
                                        <input
                                            type="number"
                                            value={campaignData.daily_budget_ttd}
                                            onChange={(e) => setCampaignData({
                                                ...campaignData,
                                                daily_budget_ttd: Number(e.target.value)
                                            })}
                                            className="w-full bg-[#0B0D14] text-white pl-10 pr-4 py-3 rounded-lg border border-[#1E2235] focus:border-[#00B894] outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-[#A9B0C3] mt-2">
                                        ~{Math.floor((campaignData.daily_budget_ttd || 0) / 45 * 1000)} impressions/day
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        Campaign Duration (days)
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A9B0C3]" />
                                        <input
                                            type="number"
                                            value={14}
                                            onChange={(e) => {
                                                const days = Number(e.target.value);
                                                setCampaignData({
                                                    ...campaignData,
                                                    lifetime_budget_ttd: (campaignData.daily_budget_ttd || 0) * days
                                                });
                                            }}
                                            className="w-full bg-[#0B0D14] text-white pl-10 pr-4 py-3 rounded-lg border border-[#1E2235] focus:border-[#00B894] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#00B894]/10 border border-[#00B894]/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 text-[#00B894] flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white mb-1">Estimated Results</h4>
                                        <p className="text-sm text-[#A9B0C3] mb-3">
                                            Total Budget: <span className="text-white font-bold">TTD {campaignData.lifetime_budget_ttd}</span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-[#A9B0C3]">Impressions</p>
                                                <p className="text-lg font-bold text-white">
                                                    {Math.floor((campaignData.lifetime_budget_ttd || 0) / 45 * 1000).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#A9B0C3]">Est. Views</p>
                                                <p className="text-lg font-bold text-white">
                                                    {Math.floor((campaignData.lifetime_budget_ttd || 0) / 45 * 1000 * 0.35).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#A9B0C3]">Est. Clicks</p>
                                                <p className="text-lg font-bold text-white">
                                                    {Math.floor((campaignData.lifetime_budget_ttd || 0) / 45 * 1000 * 0.025).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Video Upload */}
                    {currentStep === 'video' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Upload your video</h3>
                                <p className="text-[#A9B0C3]">Upload an MP4 video (max 500MB, 15-60 seconds recommended)</p>
                            </div>

                            {!videoPreviewUrl ? (
                                <label className="block border-2 border-dashed border-[#1E2235] rounded-xl p-12 text-center cursor-pointer hover:border-[#00B894] transition-colors">
                                    <input
                                        type="file"
                                        accept="video/mp4,video/webm"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                    />
                                    <Upload className="h-16 w-16 text-[#A9B0C3] mx-auto mb-4" />
                                    <h4 className="font-bold text-white mb-2">Drop your video here or click to browse</h4>
                                    <p className="text-sm text-[#A9B0C3]">MP4, WebM up to 500MB</p>
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-[#0B0D14] rounded-xl overflow-hidden">
                                        <video
                                            src={videoPreviewUrl}
                                            controls
                                            className="w-full max-h-96"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setVideoFile(null);
                                            setVideoPreviewUrl('');
                                        }}
                                        className="text-[#A9B0C3] hover:text-white text-sm"
                                    >
                                        Remove and upload different video
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: AI Assist */}
                    {currentStep === 'ai-assist' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">AI Creative Assistant</h3>
                                <p className="text-[#A9B0C3]">Let AI help you craft the perfect script and caption</p>
                            </div>

                            {/* Script Generation */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-white">Video Script</label>
                                    <button
                                        onClick={handleGenerateScript}
                                        disabled={generatingScript}
                                        className="bg-[#00B894] hover:bg-[#009071] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {generatingScript ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Generate with AI
                                            </>
                                        )}
                                    </button>
                                </div>

                                {generatedScripts.length > 0 && (
                                    <div className="space-y-3">
                                        {generatedScripts.map((script, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedScript(script)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedScript === script
                                                    ? 'border-[#00B894] bg-[#00B894]/10'
                                                    : 'border-[#1E2235] hover:border-[#2A2F47]'
                                                    }`}
                                            >
                                                <p className="text-sm text-white">{script}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Caption Generation */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-white">Social Caption</label>
                                    <button
                                        onClick={handleGenerateCaption}
                                        disabled={generatingCaption}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {generatingCaption ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Generate Captions
                                            </>
                                        )}
                                    </button>
                                </div>

                                {generatedCaptions.length > 0 && (
                                    <div className="space-y-3">
                                        {generatedCaptions.map((caption, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedCaption(caption)}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedCaption === caption
                                                    ? 'border-purple-600 bg-purple-600/10'
                                                    : 'border-[#1E2235] hover:border-[#2A2F47]'
                                                    }`}
                                            >
                                                <p className="text-sm text-white">{caption}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Preview */}
                    {currentStep === 'preview' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Campaign Preview</h3>
                                <p className="text-[#A9B0C3]">Review how your ad will appear</p>
                            </div>

                            <div className="bg-[#0B0D14] rounded-xl p-6 space-y-4">
                                <div className="bg-[#101320] rounded-lg p-4 max-w-sm mx-auto">
                                    {videoPreviewUrl && (
                                        <video
                                            src={videoPreviewUrl}
                                            controls
                                            className="w-full rounded-lg mb-3"
                                        />
                                    )}
                                    <h4 className="font-bold text-white mb-2">{campaignData.name}</h4>
                                    {selectedCaption && (
                                        <p className="text-sm text-[#A9B0C3] mb-3">{selectedCaption}</p>
                                    )}
                                    <button className="w-full bg-[#00B894] text-white py-2 rounded-lg font-semibold">
                                        {campaignData.objective === 'calls' ? 'Call Now' :
                                            campaignData.objective === 'messages' ? 'Send Message' :
                                                campaignData.objective === 'website_clicks' ? 'Visit Website' :
                                                    'Learn More'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Review */}
                    {currentStep === 'review' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Review & Launch</h3>
                                <p className="text-[#A9B0C3]">Confirm your campaign details before launching</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-[#0B0D14] rounded-xl p-4">
                                    <h4 className="font-semibold text-white mb-3">Campaign Summary</h4>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-[#A9B0C3]">Name:</dt>
                                            <dd className="text-white font-semibold">{campaignData.name}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-[#A9B0C3]">Objective:</dt>
                                            <dd className="text-white font-semibold capitalize">{campaignData.objective}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-[#A9B0C3]">Locations:</dt>
                                            <dd className="text-white font-semibold">{campaignData.target_locations?.length || 0} selected</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-[#A9B0C3]">Daily Budget:</dt>
                                            <dd className="text-white font-semibold">TTD {campaignData.daily_budget_ttd}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-[#A9B0C3]">Total Budget:</dt>
                                            <dd className="text-white font-semibold">TTD {campaignData.lifetime_budget_ttd}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="bg-[#00B894]/10 border border-[#00B894]/20 rounded-xl p-4 flex items-start gap-3">
                                    <Check className="h-5 w-5 text-[#00B894] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Ready to launch!</h4>
                                        <p className="text-sm text-[#A9B0C3]">
                                            Your campaign will be submitted for review and typically approved within 24 hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="p-6 border-t border-[#1E2235] flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                        className="text-[#A9B0C3] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg text-[#A9B0C3] hover:text-white font-semibold"
                        >
                            Save Draft
                        </button>
                        {currentStepIndex < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="bg-[#00B894] hover:bg-[#009071] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="bg-[#00B894] hover:bg-[#009071] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                            >
                                <Check className="h-5 w-5" />
                                Launch Campaign
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { X, FileText, Loader2, Download, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, JobLetterRequest } from '../services/ai';

interface JobLetterGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JobLetterGenerator: React.FC<JobLetterGeneratorProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<JobLetterRequest>({
        applicant_name: '',
        position: '',
        company_name: '',
        skills: [],
        experience_years: 0,
        tone: 'professional',
    });
    const [skillsInput, setSkillsInput] = useState('');
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleAddSkill = () => {
        if (skillsInput.trim()) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, skillsInput.trim()]
            }));
            setSkillsInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setGeneratedLetter('');

        try {
            const response = await aiService.generateJobLetter(formData);
            setGeneratedLetter(response.content);
        } catch (err: any) {
            setError(err.message || 'Failed to generate letter. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-trini-teal/10 rounded-full text-trini-teal">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Job Letter Generator</h2>
                        <p className="text-sm text-gray-500">Create a professional application in seconds.</p>
                    </div>
                </div>

                {!generatedLetter ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text" required
                                    value={formData.applicant_name}
                                    onChange={e => setFormData({ ...formData, applicant_name: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Position</label>
                                <input
                                    type="text" required
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                    placeholder="Sales Associate"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                            <input
                                type="text" required
                                value={formData.company_name}
                                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                placeholder="TriniBuild Ltd."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Years of Experience</label>
                                <input
                                    type="number" required min="0"
                                    value={formData.experience_years}
                                    onChange={e => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tone</label>
                                <select
                                    value={formData.tone}
                                    onChange={e => setFormData({ ...formData, tone: e.target.value as JobLetterRequest['tone'] })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                >
                                    <option value="professional">Professional</option>
                                    <option value="enthusiastic">Enthusiastic</option>
                                    <option value="confident">Confident</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Key Skills</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={skillsInput}
                                    onChange={e => setSkillsInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-teal outline-none"
                                    placeholder="e.g. Customer Service, Excel"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="bg-gray-100 text-gray-700 px-4 rounded-lg font-bold hover:bg-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map(skill => (
                                    <span key={skill} className="bg-trini-teal/10 text-trini-teal px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                        {skill}
                                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-trini-teal text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-5 w-5" /> Generate Letter
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 font-serif text-gray-800 leading-relaxed max-h-[50vh] overflow-y-auto">
                            <ReactMarkdown
                                className="prose prose-sm max-w-none prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal"
                                remarkPlugins={[remarkGfm]}
                            >
                                {generatedLetter}
                            </ReactMarkdown>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setGeneratedLetter('')}
                                className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 bg-trini-teal text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                {copied ? 'Copied!' : 'Copy Text'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

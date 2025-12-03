import React from 'react';
import { X, Video, Save } from 'lucide-react';
import { VideoPlacement, AVAILABLE_PAGES, PAGE_SECTIONS } from '../services/videoService';
import { VideoUpload } from './VideoUpload';

interface VideoModalProps {
    isOpen: boolean;
    editingVideo: Partial<VideoPlacement>;
    onClose: () => void;
    onSave: () => void;
    onVideoChange: (video: Partial<VideoPlacement>) => void;
}

export const VideoPlacementModal: React.FC<VideoModalProps> = ({
    isOpen,
    editingVideo,
    onClose,
    onSave,
    onVideoChange
}) => {
    if (!isOpen) return null;

    const getAvailableSections = (page: string) => {
        return PAGE_SECTIONS[page] || ['hero'];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-bold flex items-center">
                        <Video className="mr-2" /> {editingVideo.id ? 'Edit' : 'Add'} Video Placement
                    </h3>
                    <button onClick={onClose} aria-label="Close Modal">
                        <X />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Page Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Page *</label>
                            <select
                                value={editingVideo.page}
                                onChange={(e) => {
                                    const newPage = e.target.value;
                                    onVideoChange({
                                        ...editingVideo,
                                        page: newPage,
                                        section: getAvailableSections(newPage)[0]
                                    });
                                }}
                                className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                            >
                                {AVAILABLE_PAGES.map(page => (
                                    <option key={page.value} value={page.value}>{page.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Section *</label>
                            <select
                                value={editingVideo.section}
                                onChange={(e) => onVideoChange({ ...editingVideo, section: e.target.value })}
                                className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                            >
                                {getAvailableSections(editingVideo.page || 'home').map(section => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Video Source Selection */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4">Video Source</h4>

                            {/* Option 1: Upload */}
                            <div className="mb-6">
                                <VideoUpload
                                    currentUrl={editingVideo.video_url && !editingVideo.video_url.includes('youtu') ? editingVideo.video_url : undefined}
                                    onUploadComplete={(url) => onVideoChange({ ...editingVideo, video_url: url })}
                                />
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">OR USE YOUTUBE</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            {/* Option 2: YouTube URL */}
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gray-900 mb-1">
                                    YouTube Embed URL
                                </label>
                                <input
                                    type="text"
                                    value={editingVideo.video_url?.includes('youtu') ? editingVideo.video_url : ''}
                                    onChange={(e) => onVideoChange({ ...editingVideo, video_url: e.target.value })}
                                    placeholder="https://www.youtube.com/embed/..."
                                    className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Paste the full embed URL from YouTube (Share > Embed > Copy src)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Title and Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">Title *</label>
                        <input
                            type="text"
                            value={editingVideo.title}
                            onChange={(e) => onVideoChange({ ...editingVideo, title: e.target.value })}
                            placeholder="e.g., Welcome to TriniBuild"
                            className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">Description (Optional)</label>
                        <textarea
                            value={editingVideo.description}
                            onChange={(e) => onVideoChange({ ...editingVideo, description: e.target.value })}
                            placeholder="Brief description of the video"
                            rows={2}
                            className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                        />
                    </div>

                    {/* Playback Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Sort Order</label>
                            <input
                                type="number"
                                value={editingVideo.sort_order}
                                onChange={(e) => onVideoChange({ ...editingVideo, sort_order: parseInt(e.target.value) })}
                                min="1"
                                className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingVideo.active}
                                    onChange={(e) => onVideoChange({ ...editingVideo, active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-bold">Active</span>
                            </label>
                        </div>
                    </div>

                    {/* Video Controls */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingVideo.autoplay}
                                onChange={(e) => onVideoChange({ ...editingVideo, autoplay: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Autoplay</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingVideo.loop}
                                onChange={(e) => onVideoChange({ ...editingVideo, loop: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Loop</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingVideo.muted}
                                onChange={(e) => onVideoChange({ ...editingVideo, muted: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Muted</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingVideo.controls}
                                onChange={(e) => onVideoChange({ ...editingVideo, controls: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Show Controls</span>
                        </label>
                    </div>

                    {/* Preview */}
                    {editingVideo.video_url && (
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Preview</label>
                            <div className="bg-gray-900 rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                {editingVideo.video_url.includes('youtube.com') || editingVideo.video_url.includes('youtu.be') ? (
                                    <iframe
                                        src={editingVideo.video_url}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title="Video Preview"
                                    />
                                ) : (
                                    <video
                                        src={editingVideo.video_url}
                                        controls={editingVideo.controls}
                                        autoPlay={editingVideo.autoplay}
                                        loop={editingVideo.loop}
                                        muted={editingVideo.muted}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={!editingVideo.video_url || !editingVideo.title}
                            className="px-4 py-2 bg-trini-red text-white rounded font-bold flex items-center disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {editingVideo.id ? 'Update' : 'Save'} Placement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

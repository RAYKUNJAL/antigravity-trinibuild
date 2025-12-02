import React from 'react';
import { X, Video, Upload, Loader2, Save } from 'lucide-react';
import { VideoPlacement, AVAILABLE_PAGES, PAGE_SECTIONS } from '../services/videoService';

interface VideoModalProps {
    isOpen: boolean;
    editingVideo: Partial<VideoPlacement>;
    uploading: boolean;
    onClose: () => void;
    onSave: () => void;
    onVideoChange: (video: Partial<VideoPlacement>) => void;
    onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VideoPlacementModal: React.FC<VideoModalProps> = ({
    isOpen,
    editingVideo,
    uploading,
    onClose,
    onSave,
    onVideoChange,
    onVideoUpload
}) => {
    if (!isOpen) return null;

    const getAvailableSections = (page: string) => {
        return PAGE_SECTIONS[page] || ['hero'];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0">
                    <h3 className="font-bold flex items-center">
                        <Video className="mr-2" /> {editingVideo.id ? 'Edit' : 'Add'} Video Placement
                    </h3>
                    <button onClick={onClose} aria-label="Close Modal">
                        <X />
                    </button>
                </div>
                <div className="p-6 space-y-4">
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

                    {/* Video URL */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            Video URL * (YouTube embed or upload video file)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editingVideo.video_url}
                                onChange={(e) => onVideoChange({ ...editingVideo, video_url: e.target.value })}
                                placeholder="https://www.youtube.com/embed/... or upload a video"
                                className="flex-1 border border-gray-300 rounded p-2 bg-white text-gray-900"
                            />
                            <label className="bg-gray-900 text-white px-3 py-2 rounded cursor-pointer hover:bg-gray-800 flex items-center gap-2">
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span className="text-xs">Compressing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        <span className="text-xs hidden sm:inline">Upload & Compress</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={onVideoUpload}
                                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                For YouTube: Use embed URL • For uploads: Max 500MB, auto-compressed
                            </p>
                        </div>
                    </div>

                    {/* Compression Options (shown when uploading) */}
                    {uploading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                <span className="font-bold text-blue-900">Optimizing your video...</span>
                            </div>
                            <div className="space-y-2 text-sm text-blue-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    Compressing to optimal size
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    Generating thumbnail
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    Uploading to CDN
                                </div>
                            </div>
                            <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-600 h-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    )}

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
                            <label className="block text-sm font-bold text-gray-900 mb-1">Position</label>
                            <input
                                type="number"
                                value={editingVideo.position}
                                onChange={(e) => onVideoChange({ ...editingVideo, position: parseInt(e.target.value) })}
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

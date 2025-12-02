import React from 'react';
import { Share2, MessageCircle, Facebook, Twitter, Mail } from 'lucide-react';
import { viralLoopsService } from '../services/viralLoopsService';
import { authService } from '../services/auth';

interface ShareButtonsProps {
    contentType: 'listing' | 'website' | 'event' | 'job';
    contentId: string;
    title?: string;
    description?: string;
    className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
    contentType,
    contentId,
    title = 'Check this out on TriniBuild!',
    description = '',
    className = ''
}) => {
    const handleShare = async (platform: 'whatsapp' | 'facebook' | 'twitter' | 'email') => {
        const user = authService.getCurrentUser();

        // Track the share
        await viralLoopsService.trackShare(user?.id, contentType, contentId, platform);

        // Generate share URL
        const shareUrl = viralLoopsService.generateShareUrl(contentType, contentId, platform, user?.id);

        // Open share dialog
        if (platform === 'email') {
            const subject = encodeURIComponent(title);
            const body = encodeURIComponent(`${description}\n\n${shareUrl}`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        } else {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm font-medium text-gray-600">Share:</span>

            <button
                onClick={() => handleShare('whatsapp')}
                className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                aria-label="Share on WhatsApp"
                title="Share on WhatsApp"
            >
                <MessageCircle className="h-4 w-4" />
            </button>

            <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                aria-label="Share on Facebook"
                title="Share on Facebook"
            >
                <Facebook className="h-4 w-4" />
            </button>

            <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-colors"
                aria-label="Share on Twitter"
                title="Share on Twitter"
            >
                <Twitter className="h-4 w-4" />
            </button>

            <button
                onClick={() => handleShare('email')}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                aria-label="Share via Email"
                title="Share via Email"
            >
                <Mail className="h-4 w-4" />
            </button>
        </div>
    );
};

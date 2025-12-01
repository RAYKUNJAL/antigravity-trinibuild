import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface FacebookMessengerProps {
    pageId: string; // Your Facebook Page ID
    position?: 'bottom-right' | 'bottom-left';
    themeColor?: string;
}

export const FacebookMessenger: React.FC<FacebookMessengerProps> = ({
    pageId,
    position = 'bottom-right',
    themeColor = '#0084FF'
}) => {
    useEffect(() => {
        // Load Facebook SDK
        if (!(window as any).FB) {
            (window as any).fbAsyncInit = function () {
                (window as any).FB.init({
                    xfbml: true,
                    version: 'v18.0'
                });
            };

            // Load the SDK
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            document.body.appendChild(script);
        }
    }, []);

    const positionClasses = position === 'bottom-right'
        ? 'right-24 bottom-6'
        : 'left-24 bottom-6';

    return (
        <>
            {/* Facebook Customer Chat Plugin */}
            <div id="fb-root"></div>
            <div
                className="fb-customerchat"
                data-page-id={pageId}
                data-theme-color={themeColor}
                data-logged-in-greeting="Hi! How can we help you?"
                data-logged-out-greeting="Hi! How can we help you?"
            ></div>
        </>
    );
};

// Simple Messenger Button (for pages without full plugin)
interface MessengerButtonProps {
    pageId: string;
    className?: string;
}

export const MessengerButton: React.FC<MessengerButtonProps> = ({
    pageId,
    className = ''
}) => {
    const handleClick = () => {
        window.open(`https://m.me/${pageId}`, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium ${className}`}
        >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.897 1.448 5.482 3.717 7.17V22l3.573-1.965c.952.261 1.963.404 3.01.404 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.993 12.41l-2.556-2.73-4.991 2.73 5.489-5.825 2.618 2.73 4.929-2.73-5.489 5.825z" />
            </svg>
            Message Us
        </button>
    );
};

// Share on Messenger
interface MessengerShareProps {
    url: string;
    className?: string;
}

export const MessengerShare: React.FC<MessengerShareProps> = ({
    url,
    className = ''
}) => {
    const handleShare = () => {
        const shareUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.href)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <button
            onClick={handleShare}
            className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
        >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.897 1.448 5.482 3.717 7.17V22l3.573-1.965c.952.261 1.963.404 3.01.404 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.993 12.41l-2.556-2.73-4.991 2.73 5.489-5.825 2.618 2.73 4.929-2.73-5.489 5.825z" />
            </svg>
            Share on Messenger
        </button>
    );
};

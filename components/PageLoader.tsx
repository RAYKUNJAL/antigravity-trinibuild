import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <Loader2 className="h-12 w-12 text-trini-red animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading...</p>
        </div>
    </div>
);

export default PageLoader;

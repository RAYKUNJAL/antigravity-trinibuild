import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-trini-red mb-4">404</h1>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                    <p className="text-lg text-gray-600">
                        Sorry, the page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-trini-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Go Home
                    </Link>
                    <Link
                        to="/directory"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow border border-gray-200"
                    >
                        <Search className="h-5 w-5 mr-2" />
                        Browse Directory
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Popular Pages</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { name: 'Marketplace', path: '/solutions/marketplace' },
                            { name: 'Rides', path: '/solutions/rides' },
                            { name: 'Jobs', path: '/solutions/jobs' },
                            { name: 'Real Estate', path: '/solutions/living' },
                            { name: 'Tickets', path: '/solutions/tickets' },
                            { name: 'Pricing', path: '/pricing' },
                        ].map((page) => (
                            <Link
                                key={page.path}
                                to={page.path}
                                className="text-sm text-trini-red hover:text-red-700 font-medium hover:underline"
                            >
                                {page.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

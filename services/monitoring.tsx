import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

// Initialize Sentry
export const initMonitoring = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (dsn) {
        Sentry.init({
            dsn,
            integrations: [
                new BrowserTracing(),
                new Sentry.Replay({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            environment: import.meta.env.MODE,
            beforeSend(event, hint) {
                if (event.exception) {
                    const error = hint.originalException;
                    if (error && typeof error === 'object' && 'message' in error) {
                        const message = (error as Error).message;
                        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                            return null;
                        }
                    }
                }
                return event;
            },
        });
    }
};

// Error Boundary Component
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    { hasError: boolean; error: Error | null }
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className= "min-h-screen flex items-center justify-center bg-gray-50 px-4" >
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center" >
                    <div className="mb-4" >
                        <svg
                                    className="mx-auto h-12 w-12 text-red-500"
            fill = "none"
            viewBox = "0 0 24 24"
            stroke = "currentColor"
                >
                <path
                                        strokeLinecap="round"
            strokeLinejoin = "round"
            strokeWidth = { 2}
            d = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
                </svg>
                </div>
                < h1 className = "text-2xl font-bold text-gray-900 mb-2" > Something went wrong </h1>
                    < p className = "text-gray-600 mb-6" >
                        We're sorry for the inconvenience. Our team has been notified and is working on a fix.
                            </p>
                            < button
            onClick = {() => window.location.reload()
        }
        className = "bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
            Reload Page
                </button>
                </div>
                </div>
                )
            );
    }

        return this.props.children;
    }
}

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
    useEffect(() => {
        const transaction = Sentry.startTransaction({
            name: `${componentName} Mount`,
            op: 'component.mount',
        });

        return () => {
            transaction.finish();
        };
    }, [componentName]);
};

// Custom error logging
export const logError = (error: Error, context?: Record<string, any>) => {
    console.error(error);
    Sentry.captureException(error, {
        extra: context,
    });
};

// Custom event tracking
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
        category: 'user-action',
        message: eventName,
        level: 'info',
        data,
    });
};

// Performance metrics
export const measurePerformance = (metricName: string, callback: () => void) => {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    const duration = endTime - startTime;

    Sentry.addBreadcrumb({
        category: 'performance',
        message: metricName,
        level: 'info',
        data: { duration },
    });

    if (duration > 1000) {
        console.warn(`Slow operation detected: ${metricName} took ${duration}ms`);
    }
};

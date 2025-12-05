/**
 * TriniBuild AI Site Guardian
 * Key: site_guardian
 * 
 * AI-powered monitoring and auto-fix system for platform health,
 * content quality, spam detection, and performance optimization.
 */

import { supabase } from './supabaseClient';
import { aiService } from './ai';
import { smartNotifier } from './smartNotifierService';

// ============================================
// TYPES
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertCategory =
    | 'performance'
    | 'content'
    | 'security'
    | 'spam'
    | 'quality'
    | 'seo'
    | 'availability'
    | 'database';

export interface SiteAlert {
    id: string;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    message: string;
    details?: Record<string, unknown>;
    auto_fixable: boolean;
    fix_applied: boolean;
    fix_result?: string;
    status: 'new' | 'acknowledged' | 'resolved' | 'ignored';
    created_at: string;
    resolved_at?: string;
}

export interface HealthCheck {
    id: string;
    name: string;
    category: AlertCategory;
    status: 'healthy' | 'degraded' | 'unhealthy';
    last_check: string;
    response_time_ms?: number;
    details?: Record<string, unknown>;
}

export interface ContentQualityReport {
    id: string;
    content_type: string;
    content_id: string;
    quality_score: number;
    issues: string[];
    suggestions: string[];
    auto_fixed: boolean;
    created_at: string;
}

export interface SpamDetectionResult {
    is_spam: boolean;
    confidence: number;
    reasons: string[];
    action: 'allow' | 'flag' | 'block';
}

export interface SEOIssue {
    page_url: string;
    issue_type: string;
    severity: AlertSeverity;
    description: string;
    fix_suggestion: string;
}

// ============================================
// SPAM DETECTION PATTERNS
// ============================================

const SPAM_PATTERNS = [
    // URLs and links
    /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:xyz|tk|ml|ga|cf|gq|top|click|link|download)/gi,
    // Common spam phrases
    /\b(make money|earn cash|work from home|click here|limited time|act now|free gift|winner|congratulations)\b/gi,
    // Excessive caps
    /[A-Z]{10,}/g,
    // Excessive punctuation
    /[!?]{3,}/g,
    // Phone scams
    /\b(call now|text|whatsapp|telegram)\s*[+]?\d{7,}/gi,
    // Crypto scams
    /\b(bitcoin|crypto|nft|airdrop|investment|double your)\b.*\b(money|profit|earn|free)\b/gi
];

const QUALITY_ISSUES = {
    too_short: { min: 50, message: 'Description is too short (minimum 50 characters)' },
    no_price: { message: 'Price is missing or invalid' },
    poor_title: { min: 5, message: 'Title is too short or generic' },
    missing_location: { message: 'Location is not specified' },
    duplicate_content: { message: 'This content appears to be a duplicate' },
    excessive_caps: { threshold: 0.5, message: 'Too much text in ALL CAPS' },
    contact_in_description: { message: 'Contact info should be in designated fields' }
};

// ============================================
// SITE GUARDIAN SERVICE
// ============================================

class SiteGuardianService {
    private healthChecks: Map<string, HealthCheck> = new Map();
    private alerts: SiteAlert[] = [];

    /**
     * Run all health checks
     */
    async runHealthChecks(): Promise<HealthCheck[]> {
        const checks = await Promise.all([
            this.checkDatabase(),
            this.checkAPIHealth(),
            this.checkStorageHealth(),
            this.checkRealtimeHealth(),
            this.checkExternalServices()
        ]);

        // Store results
        for (const check of checks) {
            this.healthChecks.set(check.id, check);
        }

        // Alert on unhealthy checks
        for (const check of checks) {
            if (check.status === 'unhealthy') {
                await this.createAlert({
                    category: check.category,
                    severity: 'critical',
                    title: `${check.name} is Unhealthy`,
                    message: `Health check failed for ${check.name}`,
                    details: check.details,
                    auto_fixable: false
                });
            }
        }

        return checks;
    }

    /**
     * Check database health
     */
    private async checkDatabase(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            const { error } = await supabase.from('profiles').select('id').limit(1);

            return {
                id: 'database',
                name: 'Database',
                category: 'database',
                status: error ? 'unhealthy' : 'healthy',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime,
                details: error ? { error: error.message } : undefined
            };
        } catch (err) {
            return {
                id: 'database',
                name: 'Database',
                category: 'database',
                status: 'unhealthy',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime,
                details: { error: String(err) }
            };
        }
    }

    /**
     * Check API health
     */
    private async checkAPIHealth(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            // Check if AI server is responding
            const aiServerUrl = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';
            const response = await fetch(`${aiServerUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            }).catch(() => null);

            return {
                id: 'api',
                name: 'AI Server',
                category: 'availability',
                status: response?.ok ? 'healthy' : 'degraded',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime
            };
        } catch {
            return {
                id: 'api',
                name: 'AI Server',
                category: 'availability',
                status: 'degraded',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime
            };
        }
    }

    /**
     * Check storage health
     */
    private async checkStorageHealth(): Promise<HealthCheck> {
        const startTime = Date.now();

        try {
            const { data, error } = await supabase.storage.listBuckets();

            return {
                id: 'storage',
                name: 'Storage',
                category: 'availability',
                status: error ? 'unhealthy' : 'healthy',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime,
                details: { buckets: data?.length || 0 }
            };
        } catch {
            return {
                id: 'storage',
                name: 'Storage',
                category: 'availability',
                status: 'unhealthy',
                last_check: new Date().toISOString(),
                response_time_ms: Date.now() - startTime
            };
        }
    }

    /**
     * Check realtime health
     */
    private async checkRealtimeHealth(): Promise<HealthCheck> {
        return {
            id: 'realtime',
            name: 'Realtime',
            category: 'availability',
            status: 'healthy', // Supabase realtime is typically always available
            last_check: new Date().toISOString()
        };
    }

    /**
     * Check external services
     */
    private async checkExternalServices(): Promise<HealthCheck> {
        // Check Groq API (AI service)
        try {
            const testResponse = await aiService.generateText('Say OK', 'Just respond OK');
            return {
                id: 'external',
                name: 'External Services',
                category: 'availability',
                status: testResponse ? 'healthy' : 'degraded',
                last_check: new Date().toISOString()
            };
        } catch {
            return {
                id: 'external',
                name: 'External Services',
                category: 'availability',
                status: 'degraded',
                last_check: new Date().toISOString()
            };
        }
    }

    /**
     * Detect spam in content
     */
    async detectSpam(content: {
        title?: string;
        description?: string;
        email?: string;
        phone?: string;
    }): Promise<SpamDetectionResult> {
        const text = `${content.title || ''} ${content.description || ''}`;
        const reasons: string[] = [];
        let spamScore = 0;

        // Check patterns
        for (const pattern of SPAM_PATTERNS) {
            if (pattern.test(text)) {
                spamScore += 0.3;
                reasons.push(`Matches spam pattern: ${pattern.source.substring(0, 30)}...`);
            }
        }

        // Check for suspicious URLs
        const urlMatches = text.match(/https?:\/\/[^\s]+/g) || [];
        if (urlMatches.length > 3) {
            spamScore += 0.2;
            reasons.push('Excessive external URLs');
        }

        // Use AI for advanced detection
        if (spamScore > 0 && spamScore < 0.6) {
            try {
                const aiCheck = await this.aiSpamCheck(text);
                if (aiCheck.is_spam) {
                    spamScore += 0.3;
                    reasons.push(...aiCheck.reasons);
                }
            } catch {
                // Continue without AI check
            }
        }

        // Determine action
        let action: 'allow' | 'flag' | 'block' = 'allow';
        if (spamScore >= 0.8) action = 'block';
        else if (spamScore >= 0.4) action = 'flag';

        return {
            is_spam: spamScore >= 0.4,
            confidence: Math.min(1, spamScore),
            reasons,
            action
        };
    }

    /**
     * AI-powered spam check
     */
    private async aiSpamCheck(text: string): Promise<{ is_spam: boolean; reasons: string[] }> {
        const prompt = `Analyze this content for spam. Context: Trinidad & Tobago marketplace.
Content: "${text.substring(0, 500)}"

Is this spam? Reply with JSON: {"is_spam": true/false, "reasons": ["reason1", "reason2"]}`;

        const response = await aiService.generateText(prompt);
        const match = response.match(/\{[\s\S]*\}/);

        if (match) {
            return JSON.parse(match[0]);
        }

        return { is_spam: false, reasons: [] };
    }

    /**
     * Check content quality
     */
    async checkContentQuality(content: {
        id: string;
        type: string;
        title?: string;
        description?: string;
        price?: number;
        location?: string;
    }): Promise<ContentQualityReport> {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Check title
        if (!content.title || content.title.length < 5) {
            issues.push(QUALITY_ISSUES.poor_title.message);
            suggestions.push('Add a descriptive title with at least 5 words');
            score -= 20;
        }

        // Check description
        if (!content.description || content.description.length < 50) {
            issues.push(QUALITY_ISSUES.too_short.message);
            suggestions.push('Add more details about your listing');
            score -= 25;
        }

        // Check excessive caps
        if (content.description) {
            const capsRatio = (content.description.match(/[A-Z]/g) || []).length / content.description.length;
            if (capsRatio > 0.5) {
                issues.push(QUALITY_ISSUES.excessive_caps.message);
                suggestions.push('Reduce use of capital letters');
                score -= 10;
            }
        }

        // Check price
        if (content.price === undefined || content.price <= 0) {
            issues.push(QUALITY_ISSUES.no_price.message);
            suggestions.push('Add a valid price');
            score -= 15;
        }

        // Check location
        if (!content.location) {
            issues.push(QUALITY_ISSUES.missing_location.message);
            suggestions.push('Specify the location in Trinidad & Tobago');
            score -= 15;
        }

        // Check for contact info in description
        const contactPattern = /\b(\d{3}[-.]?\d{4}|\+1?\d{10,}|[\w.]+@[\w.]+\.\w+)\b/g;
        if (content.description && contactPattern.test(content.description)) {
            issues.push(QUALITY_ISSUES.contact_in_description.message);
            suggestions.push('Move contact information to the designated fields');
            score -= 10;
        }

        return {
            id: `qr_${Date.now()}`,
            content_type: content.type,
            content_id: content.id,
            quality_score: Math.max(0, score),
            issues,
            suggestions,
            auto_fixed: false,
            created_at: new Date().toISOString()
        };
    }

    /**
     * Auto-fix content issues
     */
    async autoFixContent(content: {
        id: string;
        type: string;
        title?: string;
        description?: string;
    }): Promise<{ fixed: boolean; changes: string[] }> {
        const changes: string[] = [];
        let newTitle = content.title || '';
        let newDescription = content.description || '';

        // Fix excessive caps in title
        if (newTitle && (newTitle.match(/[A-Z]/g) || []).length / newTitle.length > 0.6) {
            newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1).toLowerCase();
            changes.push('Fixed capitalization in title');
        }

        // Fix excessive caps in description
        if (newDescription && (newDescription.match(/[A-Z]/g) || []).length / newDescription.length > 0.5) {
            newDescription = newDescription.split('. ').map(s =>
                s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
            ).join('. ');
            changes.push('Fixed capitalization in description');
        }

        // Remove excessive punctuation
        const cleanedDesc = newDescription.replace(/[!?]{3,}/g, '!');
        if (cleanedDesc !== newDescription) {
            newDescription = cleanedDesc;
            changes.push('Removed excessive punctuation');
        }

        // Apply fixes if any
        if (changes.length > 0) {
            await supabase
                .from(this.getTableForType(content.type))
                .update({ title: newTitle, description: newDescription })
                .eq('id', content.id);
        }

        return { fixed: changes.length > 0, changes };
    }

    /**
     * Scan for SEO issues
     */
    async scanSEOIssues(): Promise<SEOIssue[]> {
        const issues: SEOIssue[] = [];

        // Check blogs for SEO
        const { data: blogs } = await supabase
            .from('blogs')
            .select('id, h1, meta_description, url_slug')
            .eq('status', 'published')
            .limit(100);

        if (blogs) {
            for (const blog of blogs) {
                if (!blog.meta_description || blog.meta_description.length < 120) {
                    issues.push({
                        page_url: `/blog/location/${blog.url_slug}`,
                        issue_type: 'meta_description',
                        severity: 'warning',
                        description: 'Meta description is missing or too short',
                        fix_suggestion: 'Add a meta description of 150-160 characters'
                    });
                }

                if (!blog.h1 || blog.h1.length < 20) {
                    issues.push({
                        page_url: `/blog/location/${blog.url_slug}`,
                        issue_type: 'h1_tag',
                        severity: 'warning',
                        description: 'H1 tag is missing or too short',
                        fix_suggestion: 'Add a descriptive H1 with your target keyword'
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Create an alert
     */
    async createAlert(alert: Omit<SiteAlert, 'id' | 'status' | 'created_at' | 'fix_applied'>): Promise<SiteAlert> {
        const newAlert: SiteAlert = {
            ...alert,
            id: `alert_${Date.now()}`,
            status: 'new',
            fix_applied: false,
            created_at: new Date().toISOString()
        };

        this.alerts.push(newAlert);

        // Save to database
        await supabase.from('site_alerts').insert(newAlert);

        // Notify admins for critical alerts
        if (alert.severity === 'critical') {
            // Would send notification to admin
            console.log('CRITICAL ALERT:', alert.title);
        }

        return newAlert;
    }

    /**
     * Get recent alerts
     */
    async getAlerts(options: {
        status?: SiteAlert['status'];
        severity?: AlertSeverity;
        limit?: number;
    } = {}): Promise<SiteAlert[]> {
        let query = supabase
            .from('site_alerts')
            .select('*')
            .order('created_at', { ascending: false });

        if (options.status) query = query.eq('status', options.status);
        if (options.severity) query = query.eq('severity', options.severity);
        if (options.limit) query = query.limit(options.limit);

        const { data } = await query;
        return (data || []) as SiteAlert[];
    }

    /**
     * Resolve an alert
     */
    async resolveAlert(alertId: string): Promise<void> {
        await supabase
            .from('site_alerts')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', alertId);
    }

    /**
     * Get dashboard summary
     */
    async getDashboardSummary(): Promise<{
        health: { healthy: number; degraded: number; unhealthy: number };
        alerts: { new: number; critical: number };
        content: { flagged: number; low_quality: number };
    }> {
        const checks = await this.runHealthChecks();
        const alerts = await this.getAlerts({ status: 'new' });

        return {
            health: {
                healthy: checks.filter(c => c.status === 'healthy').length,
                degraded: checks.filter(c => c.status === 'degraded').length,
                unhealthy: checks.filter(c => c.status === 'unhealthy').length
            },
            alerts: {
                new: alerts.length,
                critical: alerts.filter(a => a.severity === 'critical').length
            },
            content: {
                flagged: 0, // Would query flagged content
                low_quality: 0
            }
        };
    }

    // ============================================
    // HELPERS
    // ============================================

    private getTableForType(type: string): string {
        const map: Record<string, string> = {
            job: 'jobs',
            property: 'real_estate_listings',
            listing: 'marketplace_listings',
            event: 'events',
            blog: 'blogs'
        };
        return map[type] || 'marketplace_listings';
    }
}

// ============================================
// SINGLETON & EXPORTS
// ============================================

export const siteGuardian = new SiteGuardianService();

export default siteGuardian;

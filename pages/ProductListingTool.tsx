/**
 * ProductListingTool - Comprehensive AI product listing generator
 * Features:
 * - Full feature set for store owners
 * - Mobile-first responsive design
 * - Store linking for paid accounts
 * - Advanced filtering & search
 * - Bulk operations
 * - Analytics & insights
 * - Publishing workflow
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles, Plus, Search, Filter, Grid, List, ChevronDown, Check,
  Copy, Download, Trash2, Eye, EyeOff, Share2, Clock, TrendingUp,
  AlertCircle, Loader, CheckCircle, Settings, RefreshCw, Tag,
  ShoppingBag, BarChart3, Zap, Lock, Unlock, Calendar, ArrowRight,
  Mobile, BookOpen, DollarSign, MapPin, Star
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import ProductListingAIService, { ProductListingInput, GeneratedListing } from '../../services/productListingAIService';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Store {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
}

interface SavedListing {
  id: string;
  storeId: string;
  productName: string;
  title: string;
  description: string;
  keywords: string[];
  seoTitle?: string;
  seoDescription?: string;
  callToAction?: string;
  variationType: string;
  generatedAt: string;
  modelUsed: string;
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  clicks: number;
  conversions: number;
}

interface FilterState {
  search: string;
  store: string;
  published: 'all' | 'published' | 'draft';
  sortBy: 'newest' | 'oldest' | 'views' | 'conversions';
  dateRange: 'all' | '7d' | '30d' | '90d';
  keywords?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ProductListingTool: React.FC = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [view, setView] = useState<'list' | 'grid' | 'generator'>('list');
  const [stores, setStores] = useState<Store[]>([]);
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    store: 'all',
    published: 'all',
    sortBy: 'newest',
    dateRange: 'all'
  });

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Generator modal state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');

  // Stats
  const [stats, setStats] = useState({
    totalListings: 0,
    publishedCount: 0,
    draftCount: 0,
    totalViews: 0,
    totalConversions: 0,
    avgConversionRate: 0
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadStoresAndListings();
  }, []);

  const loadStoresAndListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, slug, subscription_plan')
        .eq('owner_id', user.id);

      if (storesError) throw storesError;

      const mappedStores: Store[] = (storesData || []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        plan: s.subscription_plan || 'free'
      }));

      setStores(mappedStores);

      if (mappedStores.length > 0) {
        setSelectedStore(mappedStores[0].id);

        // Get listings for user's stores
        const storeIds = mappedStores.map(s => s.id);
        const { data: listingsData, error: listingsError } = await supabase
          .from('ai_generated_listings')
          .select('*')
          .in('store_id', storeIds)
          .order('created_at', { ascending: false });

        if (listingsError) throw listingsError;

        const mappedListings: SavedListing[] = (listingsData || []).map(l => ({
          id: l.id,
          storeId: l.store_id,
          productName: l.product_name,
          title: l.title,
          description: l.description,
          keywords: l.keywords || [],
          seoTitle: l.seo_title,
          seoDescription: l.seo_description,
          callToAction: l.call_to_action,
          variationType: l.variation_type,
          generatedAt: l.generated_at,
          modelUsed: l.model_used,
          isPublished: l.is_published,
          publishedAt: l.published_at,
          views: l.views || 0,
          clicks: l.clicks || 0,
          conversions: l.conversions || 0
        }));

        setListings(mappedListings);
        calculateStats(mappedListings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERING & SORTING
  // ─────────────────────────────────────────────────────────────────────────

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Store filter
    if (filters.store !== 'all') {
      result = result.filter(l => l.storeId === filters.store);
    }

    // Published filter
    if (filters.published !== 'all') {
      result = result.filter(l =>
        filters.published === 'published' ? l.isPublished : !l.isPublished
      );
    }

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.productName.toLowerCase().includes(query) ||
        l.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      result = result.filter(l =>
        new Date(l.generatedAt) >= cutoffDate
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
        break;
      case 'views':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'conversions':
        result.sort((a, b) => b.conversions - a.conversions);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }

    return result;
  }, [listings, filters]);

  const calculateStats = useCallback((listingList: SavedListing[]) => {
    const published = listingList.filter(l => l.isPublished).length;
    const totalViews = listingList.reduce((sum, l) => sum + l.views, 0);
    const totalConversions = listingList.reduce((sum, l) => sum + l.conversions, 0);

    setStats({
      totalListings: listingList.length,
      publishedCount: published,
      draftCount: listingList.length - published,
      totalViews,
      totalConversions,
      avgConversionRate: totalViews > 0 ? (totalConversions / totalViews) * 100 : 0
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const publishListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('ai_generated_listings')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (error) throw error;

      setListings(listings.map(l =>
        l.id === listingId ? { ...l, isPublished: true } : l
      ));

      setSuccess('✅ Listing published!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const unpublishListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('ai_generated_listings')
        .update({ is_published: false })
        .eq('id', listingId);

      if (error) throw error;

      setListings(listings.map(l =>
        l.id === listingId ? { ...l, isPublished: false } : l
      ));

      setSuccess('✅ Listing unpublished!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('ai_generated_listings')
        .delete()
        .eq('id', listingId)
        .eq('is_published', false);

      if (error) throw error;

      setListings(listings.filter(l => l.id !== listingId));
      setSuccess('✅ Listing deleted!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const bulkPublish = async () => {
    if (selectedListings.size === 0) return;

    try {
      const ids = Array.from(selectedListings);
      const { error } = await supabase
        .from('ai_generated_listings')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      setListings(listings.map(l =>
        selectedListings.has(l.id) ? { ...l, isPublished: true } : l
      ));

      setSelectedListings(new Set());
      setSuccess(`✅ Published ${ids.length} listings!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const bulkDelete = async () => {
    if (selectedListings.size === 0) return;
    if (!confirm(`Delete ${selectedListings.size} listings?`)) return;

    try {
      const ids = Array.from(selectedListings);
      const { error } = await supabase
        .from('ai_generated_listings')
        .delete()
        .in('id', ids)
        .eq('is_published', false);

      if (error) throw error;

      setListings(listings.filter(l => !selectedListings.has(l.id)));
      setSelectedListings(new Set());
      setSuccess(`✅ Deleted ${ids.length} listings!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('✅ Copied to clipboard!');
    setTimeout(() => setSuccess(null), 1500);
  };

  const exportAsCSV = () => {
    const headers = ['Product Name', 'Title', 'Description', 'Keywords', 'Published', 'Views', 'Conversions'];
    const rows = filteredListings.map(l => [
      l.productName,
      l.title,
      l.description.substring(0, 100),
      l.keywords.join('; '),
      l.isPublished ? 'Yes' : 'No',
      l.views,
      l.conversions
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-listings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your listings...</p>
        </div>
      </div>
    );
  }

  // Check if user has paid plan
  const hasPaidPlan = stores.some(s => ['starter', 'pro', 'business'].includes(s.plan));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Product Listings
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI-powered product descriptions for your stores
                </p>
              </div>
            </div>

            {!isMobile && (
              <button
                onClick={() => setGeneratorOpen(true)}
                disabled={!hasPaidPlan}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5" />
                Generate Listing
                {!hasPaidPlan && <Lock className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ALERTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400"
            >
              ✕
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mx-4 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-900 dark:text-green-200">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STATS CARDS */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <StatsCard
            icon={<ShoppingBag />}
            label="Total"
            value={stats.totalListings}
            color="blue"
          />
          <StatsCard
            icon={<Check />}
            label="Published"
            value={stats.publishedCount}
            color="green"
          />
          <StatsCard
            icon={<Clock />}
            label="Drafts"
            value={stats.draftCount}
            color="yellow"
          />
          <StatsCard
            icon={<TrendingUp />}
            label="Views"
            value={stats.totalViews}
            color="purple"
          />
          <StatsCard
            icon={<Zap />}
            label="Conv. Rate"
            value={`${stats.avgConversionRate.toFixed(1)}%`}
            color="pink"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FILTERS & CONTROLS */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Mobile Generator Button */}
        {isMobile && (
          <button
            onClick={() => setGeneratorOpen(true)}
            disabled={!hasPaidPlan}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Sparkles className="h-5 w-5" />
            Generate Listing
            {!hasPaidPlan && <Lock className="h-4 w-4" />}
          </button>
        )}

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Search */}
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
            />
          </div>

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          )}

          {/* Desktop Filters */}
          {!isMobile && (
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.store}
                onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Stores</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={filters.published}
                onChange={(e) => setFilters({ ...filters, published: e.target.value as any })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Views</option>
                <option value="conversions">Most Conversions</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          )}

          {/* View Toggle */}
          {!isMobile && (
            <div className="flex gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded transition-colors ${view === 'list' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'text-gray-500'}`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded transition-colors ${view === 'grid' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'text-gray-500'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filters */}
        {isMobile && showMobileMenu && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
            <select
              value={filters.store}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={filters.published}
              onChange={(e) => setFilters({ ...filters, published: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="views">Most Views</option>
              <option value="conversions">Most Conversions</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BULK ACTIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {selectedListings.size > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between gap-4 flex-wrap"
        >
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {selectedListings.size} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={bulkPublish}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              Publish
            </button>
            <button
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedListings(new Set())}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LISTINGS LIST/GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredListings.length === 0 ? (
          <EmptyState hasPaidPlan={hasPaidPlan} onGenerate={() => setGeneratorOpen(true)} />
        ) : view === 'list' ? (
          <ListingsTable
            listings={filteredListings}
            stores={stores}
            selectedListings={selectedListings}
            onSelect={(id) => {
              const newSet = new Set(selectedListings);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              setSelectedListings(newSet);
            }}
            onPublish={publishListing}
            onUnpublish={unpublishListing}
            onDelete={deleteListing}
            onCopy={copyToClipboard}
            onExport={exportAsCSV}
            isMobile={isMobile}
          />
        ) : (
          <ListingsGrid
            listings={filteredListings}
            stores={stores}
            selectedListings={selectedListings}
            onSelect={(id) => {
              const newSet = new Set(selectedListings);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              setSelectedListings(newSet);
            }}
            onPublish={publishListing}
            onUnpublish={unpublishListing}
            onDelete={deleteListing}
            onCopy={copyToClipboard}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* GENERATOR MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {generatorOpen && (
        <ProductListingGeneratorModal
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={setSelectedStore}
          onClose={() => setGeneratorOpen(false)}
          onSuccess={() => {
            setGeneratorOpen(false);
            loadStoresAndListings();
          }}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const StatsCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]} border-current/20`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="h-5 w-5">{icon}</div>
      </div>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const ListingsTable: React.FC<{
  listings: SavedListing[];
  stores: Store[];
  selectedListings: Set<string>;
  onSelect: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onExport: () => void;
  isMobile: boolean;
}> = ({
  listings,
  stores,
  selectedListings,
  onSelect,
  onPublish,
  onUnpublish,
  onDelete,
  onCopy,
  onExport,
  isMobile
}) => {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {listings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            store={stores.find(s => s.id === listing.storeId)}
            isSelected={selectedListings.has(listing.id)}
            onSelect={() => onSelect(listing.id)}
            onPublish={() => onPublish(listing.id)}
            onUnpublish={() => onUnpublish(listing.id)}
            onDelete={() => onDelete(listing.id)}
            onCopy={onCopy}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={listings.length > 0 && listings.every(l => selectedListings.has(l.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedListings(new Set(listings.map(l => l.id)));
                  } else {
                    setSelectedListings(new Set());
                  }
                }}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Product</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Store</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Stats</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {listings.map(listing => {
            const store = stores.find(s => s.id === listing.storeId);
            return (
              <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedListings.has(listing.id)}
                    onChange={() => onSelect(listing.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {listing.productName}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{store?.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    listing.isPublished
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {listing.isPublished ? '✓ Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>👁 {listing.views}</span>
                    <span>✓ {listing.conversions}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {listing.isPublished ? (
                      <button
                        onClick={() => onUnpublish(listing.id)}
                        className="p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
                        title="Unpublish"
                      >
                        <EyeOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onPublish(listing.id)}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                        title="Publish"
                      >
                        <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={() => onCopy(listing.description)}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Copy description"
                    >
                      <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => onDelete(listing.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Export button */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
};

const ListingsGrid: React.FC<{
  listings: SavedListing[];
  stores: Store[];
  selectedListings: Set<string>;
  onSelect: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}> = ({ listings, stores, selectedListings, onSelect, onPublish, onUnpublish, onDelete, onCopy }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          store={stores.find(s => s.id === listing.storeId)}
          isSelected={selectedListings.has(listing.id)}
          onSelect={() => onSelect(listing.id)}
          onPublish={() => onPublish(listing.id)}
          onUnpublish={() => onUnpublish(listing.id)}
          onDelete={() => onDelete(listing.id)}
          onCopy={onCopy}
          isGrid
        />
      ))}
    </div>
  );
};

const ListingCard: React.FC<{
  listing: SavedListing;
  store?: Store;
  isSelected: boolean;
  onSelect: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
  isGrid?: boolean;
}> = ({ listing, store, isSelected, onSelect, onPublish, onUnpublish, onDelete, onCopy, isGrid }) => {
  return (
    <motion.div
      layout
      className={`relative p-4 bg-white dark:bg-gray-800 rounded-lg border ${
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-md transition-all ${isGrid ? '' : 'flex gap-4'}`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="absolute top-3 left-3 rounded border-gray-300 cursor-pointer"
      />

      {/* Content */}
      <div className={`flex-1 ${isGrid ? 'pt-8' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {listing.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {store?.name}
            </p>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            listing.isPublished
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {listing.isPublished ? '✓' : 'Draft'}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
          {listing.description}
        </p>

        {/* Keywords */}
        {listing.keywords.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {listing.keywords.slice(0, 2).map((keyword, idx) => (
              <span key={idx} className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                {keyword}
              </span>
            ))}
            {listing.keywords.length > 2 && (
              <span className="inline-block px-2 py-0.5 text-xs text-gray-500">
                +{listing.keywords.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
          <span>👁 {listing.views}</span>
          <span>✓ {listing.conversions}</span>
          <span>📅 {new Date(listing.generatedAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {listing.isPublished ? (
            <button
              onClick={onUnpublish}
              className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
            >
              <EyeOff className="h-4 w-4" />
              Unpublish
            </button>
          ) : (
            <button
              onClick={onPublish}
              className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
            >
              <Eye className="h-4 w-4" />
              Publish
            </button>
          )}
          <button
            onClick={() => onCopy(listing.description)}
            className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC<{ hasPaidPlan: boolean; onGenerate: () => void }> = ({ hasPaidPlan, onGenerate }) => {
  return (
    <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No listings yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {hasPaidPlan
          ? 'Generate your first AI-powered product listing to get started.'
          : 'Upgrade to a paid plan to start generating AI product listings.'}
      </p>
      {hasPaidPlan && (
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
        >
          <Sparkles className="h-5 w-5" />
          Generate Your First Listing
        </button>
      )}
    </div>
  );
};

// Placeholder for modal (would integrate ProductListingGenerator)
const ProductListingGeneratorModal: React.FC<{
  stores: Store[];
  selectedStore: string;
  onStoreChange: (id: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ stores, selectedStore, onStoreChange, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Generate Product Listing
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Store
            </label>
            <select
              value={selectedStore}
              onChange={(e) => onStoreChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="text-center py-8 text-gray-500">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading generator...</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListingTool;

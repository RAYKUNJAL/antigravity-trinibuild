import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Spinner } from '../components/ui/Spinner';
import {
  CheckCircle,
  MapPin,
  Phone,
  Lock,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  ChevronDown,
  User,
  Mail,
  MessageCircle,
} from 'lucide-react';

const ISLAND_OPTIONS = [
  { value: 'tt', label: 'Trinidad & Tobago 🇹🇹' },
  { value: 'jm', label: 'Jamaica 🇯🇲' },
  { value: 'bb', label: 'Barbados 🇧🇧' },
  { value: 'gy', label: 'Guyana 🇬🇾' },
  { value: 'lc', label: 'St. Lucia 🇱🇨' },
  { value: 'gd', label: 'Grenada 🇬🇩' },
  { value: 'other', label: 'Other 🌴' },
];

export const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [island, setIsland] = useState('tt');
  const [whatsapp, setWhatsapp] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const meta = (data.user.user_metadata as any) || {};
          setFirstName(meta.full_name || meta.firstName || '');
          setEmail(data.user.email || '');
          setIsland(meta.island || 'tt');
          setWhatsapp(meta.whatsapp || '');
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        data: {
          full_name: firstName,
          island,
          whatsapp,
        },
      });
      if (updateError) throw updateError;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const inputClasses =
    'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base';
  const sectionCard =
    'bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>

      {/* Profile Section */}
      <div className={sectionCard}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" /> Profile
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your name"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Island */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Which island are you on?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <select
                value={island}
                onChange={(e) => setIsland(e.target.value)}
                className={`${inputClasses} appearance-none bg-white pr-10`}
              >
                {ISLAND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp number
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 868-xxx-xxxx"
                className={inputClasses}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used so buyers and customers can reach you on WhatsApp.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-green-600 flex items-center gap-1 text-sm">
              <CheckCircle size={16} /> Saved!
            </span>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className={`${sectionCard} mt-6`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-500" /> Security
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          Need to change your password? We'll send you a secure link by email.
        </p>
        <button
          onClick={() => navigate('/forgot-password')}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
        >
          <Lock className="w-4 h-4" /> Change password
        </button>
      </div>

      {/* Danger Zone */}
      <div className={`${sectionCard} mt-6 border-red-200`}>
        <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Delete Account
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          Permanently remove your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium px-4 py-2 rounded-lg border border-red-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete my account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete account</h3>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              To delete your account, please contact our support team and they'll assist you right away.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 text-center">
              <a
                href="mailto:support@juvay.app"
                className="text-red-600 font-semibold hover:underline break-all"
              >
                support@juvay.app
              </a>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;

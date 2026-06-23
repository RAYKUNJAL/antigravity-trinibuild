import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FormField } from '../components/forms/FormField';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CheckCircle } from 'lucide-react';

export const BusinessProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.user?.id).single();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('businesses').update({
      name: profile.name, category: profile.category, city: profile.city,
      whatsapp: profile.whatsapp, phone: profile.phone, email: profile.email,
      description: profile.description,
    }).eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!profile) return <p className="text-gray-500">No business profile found. Create one first.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Business Profile</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FormField label="Business Name" name="name" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        <FormField label="Category" name="category" value={profile.category || ''} onChange={(e) => setProfile({ ...profile, category: e.target.value })} />
        <FormField label="City / Town" name="city" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
        <FormField label="WhatsApp Number" name="whatsapp" type="tel" value={profile.whatsapp || ''} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
        <FormField label="Phone" name="phone" type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <FormField label="Email" name="email" type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
        <FormField label="Description" name="description" type="textarea" value={profile.description || ''} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={save} disabled={saving}>{saving ? <Spinner size="sm" /> : 'Save Changes'}</Button>
          {saved && <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle size={16} /> Saved!</span>}
        </div>
      </div>
    </div>
  );
};

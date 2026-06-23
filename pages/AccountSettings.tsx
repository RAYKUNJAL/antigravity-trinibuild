import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FormField } from '../components/forms/FormField';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CheckCircle } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ email: data.user.email || '', firstName: (data.user.user_metadata as any)?.full_name || '' });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.auth.updateUser({
      email: user.email,
      data: { full_name: user.firstName },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FormField label="Name" name="firstName" value={user?.firstName || ''} onChange={(e) => setUser({ ...user, firstName: e.target.value })} />
        <FormField label="Email" name="email" type="email" value={user?.email || ''} onChange={(e) => setUser({ ...user, email: e.target.value })} />
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={save} disabled={saving}>{saving ? <Spinner size="sm" /> : 'Save Changes'}</Button>
          {saved && <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle size={16} /> Saved!</span>}
        </div>
      </div>
    </div>
  );
};

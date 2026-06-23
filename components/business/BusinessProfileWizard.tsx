import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/Button';
import { FormField } from '../forms/FormField';
import { TagInput } from '../forms/TagInput';
import { PhoneInput } from '../forms/PhoneInput';
import { Spinner } from '../ui/Spinner';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const steps = ['Basic Info', 'Contact', 'Description', 'Hours', 'Review'];
const categories = ['Salon', 'Barber', 'Tattoo', 'Restaurant', 'Food Vendor', 'Mechanic', 'Real Estate', 'Tutor', 'Shop', 'Other'];

export const BusinessProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', country: 'Trinidad and Tobago', city: '',
    whatsapp: '', phone: '', email: '',
    description: '', services: [] as string[],
    hours: 'Mon-Fri 8am-6pm',
  });
  const [cc, setCc] = useState('+868');

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase.from('businesses').insert({
        owner_id: userData.user?.id,
        name: form.name,
        slug,
        category: form.category,
        country: form.country,
        city: form.city,
        whatsapp: `${cc}${form.whatsapp}`,
        phone: form.phone,
        email: form.email,
        description: form.description,
        status: 'active',
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (e) {
      alert('Error saving business profile. Check console.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mb-6">Step {step + 1}: {steps[step]}</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {step === 0 && (
          <>
            <FormField label="Business Name" name="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Islandcity Tattoos" />
            <FormField label="Category" name="category" type="select" required value={form.category} onChange={(e) => set('category', e.target.value)}
              options={categories.map((c) => ({ value: c, label: c }))} />
            <FormField label="Country" name="country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            <FormField label="City / Town" name="city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Port of Spain" />
          </>
        )}
        {step === 1 && (
          <>
            <PhoneInput label="WhatsApp Number" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} countryCode={cc} onCountryCodeChange={setCc} />
            <FormField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </>
        )}
        {step === 2 && (
          <>
            <FormField label="Business Description" name="description" type="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell customers what you do..." />
            <TagInput label="Services / Products" tags={form.services} onChange={(tags) => set('services', tags)} placeholder="e.g. Haircuts, Tattoos, Consultation" />
          </>
        )}
        {step === 3 && (
          <FormField label="Opening Hours" name="hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Mon-Fri 8am-6pm" />
        )}
        {step === 4 && (
          <div className="space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Your Profile</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Name:</span> {form.name}</div>
              <div><span className="text-gray-500">Category:</span> {form.category}</div>
              <div><span className="text-gray-500">Country:</span> {form.country}</div>
              <div><span className="text-gray-500">City:</span> {form.city}</div>
              <div><span className="text-gray-500">WhatsApp:</span> {cc}{form.whatsapp}</div>
              <div><span className="text-gray-500">Hours:</span> {form.hours}</div>
            </div>
            {form.description && <div className="mt-3"><span className="text-gray-500">Description:</span> {form.description}</div>}
            {form.services.length > 0 && <div className="mt-3"><span className="text-gray-500">Services:</span> {form.services.join(', ')}</div>}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>Next <ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={submit} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Create Profile'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

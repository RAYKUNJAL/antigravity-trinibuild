'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import WelcomeCelebration from '@/components/WelcomeCelebration';

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth?mode=signup');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleComplete = () => {
    router.push('/setup');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-trini-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <WelcomeCelebration onComplete={handleComplete} />;
}

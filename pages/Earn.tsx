
import React from 'react';
import { Car, ShoppingBag, Briefcase, ArrowRight, CheckCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Earn: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-trini-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Make Money on <span className="text-trini-red">TriniBuild</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            One platform, three ways to earn. Join thousands of Trinbagonians building their future with us.
          </p>
        </div>
      </div>

      {/* The Three Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Merchant Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-trini-red hover:transform hover:-translate-y-1 transition-all">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-8 w-8 text-trini-red" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Selling</h3>
            <p className="text-gray-500 mb-6 min-h-[80px]">
              Open your digital store in minutes. Sell products, food, or services to customers nationwide.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Free Online Storefront</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> 10 Free Listings</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> WhatsApp Checkout</li>
            </ul>
            <Link to="/create-store" className="block w-full bg-trini-red text-white text-center py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
              Create Store
            </Link>
          </div>

          {/* Driver Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600 hover:transform hover:-translate-y-1 transition-all">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Car className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Drive & Deliver</h3>
            <p className="text-gray-500 mb-6 min-h-[80px]">
              Turn your vehicle into an income stream. Accept ride requests or deliver packages on your schedule.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Weekly Payouts</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Flexible Hours</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Keep 85% of Fares</li>
            </ul>
            <Link to="/driver/onboarding" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
              Become a Driver
            </Link>
          </div>

          {/* Professional Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-600 hover:transform hover:-translate-y-1 transition-all">
            <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Find Work</h3>
            <p className="text-gray-500 mb-6 min-h-[80px]">
              Showcase your skills. Get hired for full-time jobs, freelance gigs, or one-off tasks.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Professional Profile</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> 'Easy Apply' to Jobs</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Skill Verification</li>
            </ul>
            <Link to="/work/profile" className="block w-full bg-purple-600 text-white text-center py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">
              Build CV Profile
            </Link>
          </div>

        </div>
      </div>

      {/* Testimonials / Social Proof */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Who's earning with TriniBuild?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop" className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="Sarah J." />
              </div>
              <p className="text-gray-600 italic mb-4">"I started selling my homemade pepper sauce here. Now I ship cases to Tobago weekly!"</p>
              <p className="font-bold text-gray-900">- Sarah J., Chaguanas</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=200&auto=format&fit=crop" className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="David R." />
              </div>
              <p className="text-gray-600 italic mb-4">"Driving part-time helped me pay off my car loan. The app is super easy to use."</p>
              <p className="font-bold text-gray-900">- David R., Port of Spain</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <img src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=200&auto=format&fit=crop" className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="Amanda K." />
              </div>
              <p className="text-gray-600 italic mb-4">"Found a graphic design gig in 2 days. The profile builder is great."</p>
              <p className="font-bold text-gray-900">- Amanda K., Arima</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-trini-teal py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Not sure where to start?</h2>
          <p className="text-white/80 text-lg mb-8">Create a free account and explore the dashboard. You can add any service later.</p>
          <Link to="/auth" className="inline-block bg-white text-trini-teal font-bold px-10 py-4 rounded-full shadow-lg hover:bg-gray-100 text-lg">
            Join TriniBuild Free
          </Link>
        </div>
      </div>

    </div>
  );
};

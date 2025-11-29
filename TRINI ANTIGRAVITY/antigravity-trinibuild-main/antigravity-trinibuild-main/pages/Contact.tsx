import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Get in touch with <span className="text-trini-red">TriniBuild</span>
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Whether you're a business owner, driver, or looking for a partnership, we're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="bg-trini-black text-white rounded-2xl shadow-xl p-10 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-trini-red mr-4 mt-1" />
                  <div>
                    <p className="font-bold">Phone</p>
                    <p className="text-gray-300">+1 (868) 555-0199</p>
                    <p className="text-gray-500 text-sm">Mon-Fri, 8am - 5pm</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-trini-red mr-4 mt-1" />
                  <div>
                    <p className="font-bold">Email</p>
                    <p className="text-gray-300">sales@trinibuild.tt</p>
                    <p className="text-gray-300">support@trinibuild.tt</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-trini-red mr-4 mt-1" />
                  <div>
                    <p className="font-bold">Office</p>
                    <p className="text-gray-300">
                      One Woodbrook Place,<br />
                      Port of Spain,<br />
                      Trinidad & Tobago
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10">
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <p className="italic text-gray-300">
                  "TriniBuild's support team helped us get our restaurant online in under 24 hours. Fantastic service."
                </p>
                <p className="font-bold mt-4">- Roti King, San Juan</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-10">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="mt-8 text-trini-red font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input type="text" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-trini-red focus:border-trini-red" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input type="email" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-trini-red focus:border-trini-red" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 focus:ring-trini-red focus:border-trini-red bg-white">
                    <option>General Inquiry</option>
                    <option>Sales / Enterprise Plan</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea required rows={4} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-trini-red focus:border-trini-red" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="w-full bg-trini-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center">
                  Send Message <Send className="ml-2 h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
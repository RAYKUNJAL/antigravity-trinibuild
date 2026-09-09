import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const SUPPORT_EMAIL = 'support@juvay.app';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Get in touch with <span className="text-trini-red">Juvay</span>
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
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-gray-300 underline hover:text-white"
                    >
                      {SUPPORT_EMAIL}
                    </a>
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
                <p className="text-gray-300">Write us. Empty inbox stays empty until you do.</p>
              </div>
            </div>
          </div>

          {/* Honest contact — no fake send */}
          <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col justify-center">
            <div className="bg-red-50 p-4 rounded-full mb-6 w-fit">
              <Mail className="h-10 w-10 text-trini-red" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Email support</h3>
            <p className="text-gray-500 mb-8">
              This page does not send messages. There is no contact API on this origin.
              Write {SUPPORT_EMAIL} and we will reply from that inbox.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="w-full bg-trini-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center"
            >
              Email {SUPPORT_EMAIL} <Mail className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

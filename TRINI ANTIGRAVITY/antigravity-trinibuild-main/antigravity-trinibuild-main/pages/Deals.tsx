import React, { useState, useEffect } from 'react';
import { Timer, Tag, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Deals: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev; // Expired
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const deals = [
    { id: 1, name: "Samsung 55' 4K Smart TV", store: "Tech Giants TT", oldPrice: 4500, newPrice: 3200, img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800", discount: 28 },
    { id: 2, name: "Designer Handbag", store: "Fashion Ave", oldPrice: 1200, newPrice: 600, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800", discount: 50 },
    { id: 3, name: "Weekend Resort Pass", store: "Coco Reef", oldPrice: 2500, newPrice: 1800, img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800", discount: 28 },
    { id: 4, name: "Air Fryer XL", store: "Home & Garden", oldPrice: 900, newPrice: 550, img: "https://images.unsplash.com/photo-1626163781947-1b7c5d419b98?q=80&w=800", discount: 38 },
    { id: 5, name: "Men's Running Shoes", store: "Sport World", oldPrice: 800, newPrice: 400, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800", discount: 50 },
    { id: 6, name: "Bluetooth Speaker", store: "Audio Lab", oldPrice: 350, newPrice: 199, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800", discount: 43 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
               <h1 className="text-4xl md:text-5xl font-extrabold mb-2 flex items-center">
                  <Tag className="h-10 w-10 mr-4 transform -rotate-12 text-yellow-300" />
                  Flash Sales
               </h1>
               <p className="text-xl text-indigo-100">Exclusive deals from local stores up to 70% off.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-4">
               <div className="text-right">
                  <p className="text-xs uppercase font-bold tracking-wider text-indigo-200">Ending In</p>
                  <div className="font-mono text-3xl font-bold">
                     {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </div>
               </div>
               <Timer className="h-10 w-10 text-yellow-300 animate-pulse" />
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {deals.map((deal) => (
               <div key={deal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
                  <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1 rounded-full z-10 shadow-md">
                     -{deal.discount}%
                  </div>
                  <div className="h-56 overflow-hidden relative">
                     <img src={deal.img} alt={deal.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">{deal.store}</p>
                     <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{deal.name}</h3>
                     <div className="flex items-end gap-2 mb-4">
                        <span className="text-2xl font-extrabold text-red-600">TT${deal.newPrice}</span>
                        <span className="text-sm text-gray-400 line-through mb-1">TT${deal.oldPrice}</span>
                     </div>
                     <Link to="/directory" className="block w-full bg-gray-900 text-white text-center py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors">
                        View Deal
                     </Link>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';

export const BlogPost: React.FC = () => {
  const { id } = useParams();

  // In a real app, fetch this by ID. For now, we simulate dynamic content.
  const post = {
    title: "How 'Roti King' Increased Sales by 300% with TriniBuild",
    date: "Oct 12, 2025",
    author: "Ray Kunjal",
    category: "Success Stories",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1200",
    content: `
      <p class="lead text-xl text-gray-600 mb-6 font-medium">
        From a small roadside stall to shipping frozen roti to Tobago. Learn how digital tools transformed this local business.
      </p>
      
      <h2>The Struggle of Cash Only</h2>
      <p class="mb-4">
        For 15 years, Mr. Singh ran his shop on a cash-only basis. While the food was excellent, he missed out on corporate orders and customers who didn't carry cash. "People would call and ask if they could transfer money, and I had to say no," Singh recalls.
      </p>

      <h2>The Digital Pivot</h2>
      <p class="mb-4">
        Singh discovered TriniBuild's <strong>Community Plan</strong>. Within minutes, he had a digital menu. He didn't need a credit card processor; he simply used the <strong>WhatsApp Checkout</strong> feature.
      </p>
      
      <blockquote class="border-l-4 border-trini-red pl-4 italic my-6 text-gray-700 bg-gray-50 p-4 rounded-r-lg">
        "The first day I posted my TriniBuild link on Facebook, I got 20 orders for lunch delivery. I couldn't believe it."
      </blockquote>

      <h2>Scaling Up</h2>
      <p class="mb-4">
        With the revenue tracking in his dashboard, Singh realized his "Boneless Curry Goat" was his bestseller. He used TriniBuild Go to hire drivers for deliveries, expanding his reach from just San Juan to Port of Spain and Chaguanas.
      </p>

      <h2>Conclusion</h2>
      <p>
        Today, Roti King is on the Enterprise plan, shipping frozen packs nationwide. It started with a free account.
      </p>
    `
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header Image */}
      <div className="h-[40vh] w-full relative">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="text-white/80 hover:text-white flex items-center mb-4 text-sm font-bold uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
            </Link>
            <span className="bg-trini-red text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center text-white/90 text-sm">
              <div className="flex items-center mr-6">
                <User className="h-4 w-4 mr-2" /> {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" /> {post.date}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <article className="lg:col-span-8 prose prose-lg prose-red max-w-none text-gray-800">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Share this story</h3>
              <div className="flex gap-4">
                 <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><Facebook className="h-5 w-5" /></button>
                 <button className="bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600"><Twitter className="h-5 w-5" /></button>
                 <button className="bg-blue-800 text-white p-2 rounded-full hover:bg-blue-900"><Linkedin className="h-5 w-5" /></button>
                 <button className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-900"><Share2 className="h-5 w-5" /></button>
              </div>
           </div>

           <div className="bg-trini-black text-white p-8 rounded-xl shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Start Your Own Story</h3>
              <p className="text-gray-400 mb-6 text-sm">Join Roti King and thousands of others.</p>
              <Link to="/create-store" className="block w-full bg-trini-red text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
                 Build Free Store
              </Link>
           </div>
        </aside>
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, User, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Blog: React.FC = () => {
  const posts = [
    {
      id: 1,
      title: "How 'Roti King' Increased Sales by 300% with TriniBuild",
      excerpt: "From a small roadside stall to shipping frozen roti to Tobago. Learn how digital tools transformed this local business.",
      category: "Success Stories",
      author: "Ray Kunjal",
      date: "Oct 12, 2025",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800"
    },
    {
      id: 2,
      title: "5 Tips for Local SEO in Trinidad & Tobago",
      excerpt: "Getting found on Google Maps is crucial. Here are 5 easy steps to optimize your TriniBuild profile.",
      category: "Guides",
      author: "Sarah Lee",
      date: "Oct 08, 2025",
      image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800"
    },
    {
      id: 3,
      title: "Introducing TriniRides: The Future of Transport",
      excerpt: "We are expanding! Learn about our new rideshare features and how drivers can earn more.",
      category: "Platform News",
      author: "TriniBuild Team",
      date: "Sep 25, 2025",
      image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">News & Insights</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Stories from our community and updates on how to grow your business in the Caribbean.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
              <div className="h-48 w-full relative">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-trini-red">
                  {post.category}
                </div>
              </div>
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Calendar className="h-3 w-3 mr-1" /> {post.date}
                    <span className="mx-2">•</span>
                    <User className="h-3 w-3 mr-1" /> {post.author}
                  </div>
                  <Link to={`/blog/${post.id}`} className="block mt-2">
                    <p className="text-xl font-bold text-gray-900 hover:text-trini-red transition-colors">{post.title}</p>
                    <p className="mt-3 text-base text-gray-500">{post.excerpt}</p>
                  </Link>
                </div>
                <div className="mt-6">
                  <Link to={`/blog/${post.id}`} className="flex items-center text-sm font-bold text-trini-red hover:text-red-700">
                    Read full story <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
          <TrendingUp className="h-12 w-12 text-trini-teal mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have a success story?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            If TriniBuild has helped your business grow, we'd love to hear about it and feature you on our blog and social media.
          </p>
          <Link to="/contact" className="inline-block bg-trini-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800">
            Submit Your Story
          </Link>
        </div>
      </div>
    </div>
  );
};
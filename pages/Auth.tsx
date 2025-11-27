import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '', // New field
    lastName: '',  // New field
    email: '',
    password: ''
      < div className="bg-trini-black w-16 h-16 rounded-lg mx-auto flex items-center justify-center mb-4" >
      <span className="text-trini-red text-3xl font-extrabold">TB</span>
        </div >
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Join TriniBuild'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Sign in to your account' : 'Create your free account today'}
        </p>
      </div >

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-trini-red focus:border-trini-red"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-trini-red focus:border-trini-red"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="email"
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-trini-red focus:border-trini-red"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="password"
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-trini-red focus:border-trini-red"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-trini-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all"
          >
            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button type="button" className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Globe className="h-4 w-4 mr-2 text-blue-600" /> Google
        </button>

      </form>

      <div className="text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-trini-red hover:underline font-medium">
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div >
  </div >
);
};
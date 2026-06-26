'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, KeyRound, Sparkles, HeartHandshake, Eye, EyeOff } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { graphqlRequest } from '@/lib/graphqlClient';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useCart();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in, redirect them to profile
  useEffect(() => {
    async function checkLoggedIn() {
      try {
        const query = `
          query CheckMe {
            me {
              _id
            }
          }
        `;
        const data = await graphqlRequest(query);
        if (data && data.me) {
          const redirectTo = searchParams?.get('redirect') || '/profile';
          router.push(redirectTo);
        }
      } catch (err) {
        // Not logged in, stay on page
      }
    }
    checkLoggedIn();
  }, [router, searchParams]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const loginMutation = `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              user {
                _id
                name
                email
              }
              token
            }
          }
        `;
        const data = await graphqlRequest(loginMutation, { email, password });
        if (data && data.login) {
          showToast(`Welcome back, ${data.login.user.name}!`, 'success');
          // Refresh the page / trigger hard refresh of page router so header updates session cookies
          window.location.href = searchParams?.get('redirect') || '/profile';
        } else {
          showToast('Login failed. Please check your credentials.', 'error');
        }
      } else {
        const registerMutation = `
          mutation Register($name: String!, $email: String!, $password: String!) {
            register(name: $name, email: $email, password: $password) {
              user {
                _id
                name
                email
              }
              token
            }
          }
        `;
        const data = await graphqlRequest(registerMutation, { name, email, password });
        if (data && data.register) {
          showToast(`Account created! Welcome ${data.register.user.name}.`, 'success');
          window.location.href = searchParams?.get('redirect') || '/profile';
        } else {
          showToast('Registration failed.', 'error');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      showToast(err.message || 'An error occurred during authentication.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow py-16 bg-[#FFFDF9] flex items-center justify-center min-h-[80vh] select-none">
      <div className="max-w-md w-full mx-4 relative">
        {/* Soft background accents */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="bg-white border border-[#EEDDCC] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#5C4033]/5 relative z-10">
          
          {/* Header section */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-[#FBF7F0] border border-[#EEDDCC] rounded-2xl mb-4 text-[#A855F7]">
              {isLogin ? <KeyRound className="w-6 h-6 animate-pulse" /> : <Sparkles className="w-6 h-6 animate-bounce" />}
            </div>
            <h1 className="font-serif font-black text-3xl text-[#5C4033] tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {isLogin 
                ? 'Sign in to access your crochet pattern libraries' 
                : 'Join Yarn Craft Co and start your crochet journey'
              }
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 p-1.5 bg-[#FBF7F0] border border-[#EEDDCC] rounded-2xl mb-6">
            <button
              onClick={() => { setIsLogin(true); setEmail(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isLogin 
                  ? 'bg-[#A855F7] text-white shadow-sm' 
                  : 'text-[#5C4033]/70 hover:text-[#A855F7]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setEmail(''); setPassword(''); setName(''); setConfirmPassword(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isLogin 
                  ? 'bg-[#A855F7] text-white shadow-sm' 
                  : 'text-[#5C4033]/70 hover:text-[#A855F7]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Registration Name Field */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none transition-colors"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Password</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => showToast('Password reset is simulated. Check support@yarncraftco.com', 'info')}
                    className="text-[10px] font-bold text-[#A855F7] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 pr-10 text-sm text-[#1F2937] outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#A855F7] outline-none"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration Confirm Password */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 pl-10 text-sm text-[#1F2937] outline-none transition-colors"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Action CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:shadow-none transition-all mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In to Account' : 'Register New Account'}</span>
              )}
            </button>
          </form>

          {/* Bottom disclaimer info */}
          <div className="mt-8 pt-6 border-t border-[#FFF8EF] text-center flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
            <HeartHandshake className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Secure account protection using industry standard JWT.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

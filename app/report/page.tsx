'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, MessageSquare, ShieldAlert, FileText, Send, User, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { graphqlRequest } from '@/lib/graphqlClient';
import Link from 'next/link';

export default function ReportPage() {
  const router = useRouter();
  const { showToast } = useCart();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill user profile details if logged in
  useEffect(() => {
    async function loadUser() {
      try {
        const query = `
          query GetReportMe {
            me {
              name
              email
            }
          }
        `;
        const data = await graphqlRequest(query);
        if (data && data.me) {
          setName(data.me.name || '');
          setEmail(data.me.email || '');
        }
      } catch (err) {
        // Suppress guest user log
      }
    }
    loadUser();
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const mutation = `
        mutation CreateReport($name: String!, $email: String!, $subject: String!, $message: String!) {
          createReport(name: $name, email: $email, subject: $subject, message: $message) {
            _id
            status
          }
        }
      `;

      const data = await graphqlRequest(mutation, { name, email, subject, message });

      if (data && data.createReport) {
        showToast('Thank you! Your issue report has been submitted successfully. Our team will review it shortly.', 'success');
        setName('');
        setMessage('');
        router.push('/');
      } else {
        showToast('Failed to submit report. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      showToast(err.message || 'Error occurred while saving issue report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-grow py-16 bg-[#FFFDF9] flex items-center justify-center min-h-[85vh] select-none">
      <div className="max-w-2xl w-full mx-4 relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="bg-white border border-[#EEDDCC] rounded-3xl p-8 sm:p-12 shadow-xl shadow-[#5C4033]/5 relative z-10 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-2xl">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#5C4033] tracking-tight">
              Report an Issue
            </h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Facing checkout problems, downloading issues, or need help with a crochet stitch instruction? Let us know, and we'll resolve it as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
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

              {/* Email Address */}
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
            </div>

            {/* Subject Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Issue Topic</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-3 px-4 text-sm text-[#1F2937] outline-none transition-colors appearance-none cursor-pointer font-medium"
                >
                  <option value="Bug Report">🐛 Bug Report (Site Errors, Layout issues)</option>
                  <option value="Order Delivery Issue">🧶 Order Delivery Issue (PDF pattern download links missing)</option>
                  <option value="Stitch Instruction Help">📖 Stitch Instruction Help (Need help with patterns)</option>
                  <option value="General Inquiry">💬 General Inquiry</option>
                  <option value="Other">❓ Other Support Issue</option>
                </select>
                <ChevronRight className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Message Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5C4033] uppercase tracking-wide">Details & Description</label>
              <div className="relative">
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your issue with as much detail as possible (e.g. Order ID, pattern name, stitch row number)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-3 px-4 pl-10 text-sm text-[#1F2937] outline-none transition-colors resize-y min-h-[120px]"
                />
                <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:shadow-none transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

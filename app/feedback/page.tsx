// app/feedback/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser } from '@/lib/supabase';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<'support' | 'feedback' | 'bug'>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user email if authenticated
      const user = await getUser();
      const userEmail = user?.email || email || 'Not provided';

      // Build clean email body
      let emailBody = '';
      let emailSubject = '';

      if (feedbackType === 'support') {
        emailSubject = `[SUPPORT] ${subject}`;
        emailBody = [
          'SUPPORT REQUEST',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `Subject: ${subject}`,
          '',
          'Issue Description:',
          message,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `📧 Account: ${userEmail}`,
          `🕒 Sent: ${new Date().toLocaleString()}`,
          '🌐 From: EVSecure Support Form'
        ].join('\n');
      } else if (feedbackType === 'bug') {
        emailSubject = `[BUG REPORT] ${subject}`;
        emailBody = [
          '🐛 BUG REPORT',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `Subject: ${subject}`,
          '',
          'Bug Description:',
          message,
          '',
          'Steps to Reproduce:',
          '1. ',
          '2. ',
          '3. ',
          '',
          'Expected Behavior:',
          '',
          '',
          'Actual Behavior:',
          '',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `📧 Account: ${userEmail}`,
          `🕒 Sent: ${new Date().toLocaleString()}`,
          `💻 Browser: ${navigator.userAgent}`,
          '🌐 From: EVSecure Bug Report Form'
        ].join('\n');
      } else {
        emailSubject = `[FEEDBACK] ${subject}`;
        emailBody = [
          '💬 FEEDBACK',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `Subject: ${subject}`,
          '',
          'Message:',
          message,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `📧 From: ${userEmail}`,
          `🕒 Sent: ${new Date().toLocaleString()}`,
          '🌐 Via: EVSecure Feedback Form'
        ].join('\n');
      }

      // Create mailto link with proper encoding
      const mailtoLink = `mailto:cwplabs@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.location.href = mailtoLink;

      // Show success message
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setSubject('');
        setMessage('');
        setEmail('');
      }, 3000);

    } catch (err: any) {
      console.error('Feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Client Opened!</h2>
            <p className="text-gray-400 mb-6">
              Your email client should open with a pre-filled message. Send it when you're ready!
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Contact Us</h1>
                <p className="text-sm text-gray-400">We'd love to hear from you</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Support Card */}
          <button
            onClick={() => setFeedbackType('support')}
            className={`p-6 rounded-xl border-2 transition-all ${
              feedbackType === 'support'
                ? 'bg-purple-500/20 border-purple-500'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                feedbackType === 'support' ? 'bg-purple-500/30' : 'bg-purple-500/10'
              }`}>
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Support</h3>
              <p className="text-sm text-gray-400">Get help with issues</p>
            </div>
          </button>

          {/* Feedback Card */}
          <button
            onClick={() => setFeedbackType('feedback')}
            className={`p-6 rounded-xl border-2 transition-all ${
              feedbackType === 'feedback'
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                feedbackType === 'feedback' ? 'bg-blue-500/30' : 'bg-blue-500/10'
              }`}>
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Feedback</h3>
              <p className="text-sm text-gray-400">Share your ideas</p>
            </div>
          </button>

          {/* Bug Report Card */}
          <button
            onClick={() => setFeedbackType('bug')}
            className={`p-6 rounded-xl border-2 transition-all ${
              feedbackType === 'bug'
                ? 'bg-red-500/20 border-red-500'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-red-500/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                feedbackType === 'bug' ? 'bg-red-500/30' : 'bg-red-500/10'
              }`}>
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Bug Report</h3>
              <p className="text-sm text-gray-400">Report an issue</p>
            </div>
          </button>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder={
                  feedbackType === 'support' 
                    ? 'Brief description of your issue' 
                    : feedbackType === 'bug' 
                    ? 'What went wrong?' 
                    : 'What would you like to share?'
                }
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {feedbackType === 'bug' ? 'Bug Description' : 'Message'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={8}
                placeholder={
                  feedbackType === 'support'
                    ? 'Please describe your issue in detail...'
                    : feedbackType === 'bug'
                    ? 'What happened? What did you expect to happen?'
                    : 'Tell us what you think...'
                }
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Email (optional if signed in)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">
                We'll use your account email if you're signed in
              </p>
            </div>

            {feedbackType === 'bug' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                <p className="text-sm text-amber-300 mb-2 font-semibold">
                  Tips for reporting bugs:
                </p>
                <ul className="text-xs text-amber-200 space-y-1">
                  <li>• Describe what you were trying to do</li>
                  <li>• List the steps to reproduce the issue</li>
                  <li>• Include any error messages you saw</li>
                  <li>• Mention your browser and device</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send {feedbackType === 'support' ? 'Support Request' : feedbackType === 'bug' ? 'Bug Report' : 'Feedback'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-400 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                We typically respond within 24-48 hours. For urgent issues, please mark your email as high priority.
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

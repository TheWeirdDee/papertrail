'use client';

import { useState } from 'react';
import { Mail, MessageSquare, User, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type FormState = 'idle' | 'sending' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<FormState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setState('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050505' }}>
      <Navbar />
      <main className="flex-1 px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">

            {/* Left — info */}
            <div className="lg:sticky lg:top-28 flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Contact</p>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                  Get in touch
                </h1>
                <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                  Have a question about PaperTrail, need help with your documents, or want to report an issue? We&apos;d love to hear from you.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
                    <Mail size={15} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Email</p>
                    <a href="mailto:support@papertrail.app" className="text-sm text-gray-400 hover:text-accent transition-colors">
                      support@papertrail.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
                    <MessageSquare size={15} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Response time</p>
                    <p className="text-sm text-gray-400">We typically respond within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
              {state === 'success' ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <CheckCircle2 size={48} className="text-green-400" />
                  <h2 className="text-xl font-bold text-white">Message sent!</h2>
                  <p className="text-sm text-gray-400">
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setState('idle')}
                    className="mt-2 text-sm text-accent hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h2 className="text-lg font-bold text-white mb-1">Send us a message</h2>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {state === 'error' && (
                    <p className="text-sm text-red-400">Something went wrong. Please try emailing us directly.</p>
                  )}

                  <button
                    type="submit"
                    disabled={state === 'sending'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-secondary)] px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state === 'sending' ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

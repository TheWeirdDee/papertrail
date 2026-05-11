'use client';

import { useState } from 'react';
import { X, Send, CreditCard, Loader2 } from 'lucide-react';
import { tipAuthor } from '@/lib/stacks';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface SendSTXModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendSTXModal({ isOpen, onClose }: SendSTXModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address: currentAddress } = useSelector((state: RootState) => state.user);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      await tipAuthor(recipient, parseFloat(amount), currentAddress);
      
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: localStorage.getItem('gm_user_address') })
      });

      toast.success('Transaction broadcasted successfully!', {
        style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send STX');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-white/5 bg-[#0A0A0A] p-8 shadow-2xl transition-all">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Send className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Send STX</h2>
          <p className="text-sm text-gray-400 mt-2">
            Send STX through the GM Social Protocol. You'll both earn interaction points and rewards.
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              Recipient Address
            </label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="SP..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-2xl border border-white/5 bg-white/5 py-4 pl-12 pr-4 text-sm font-bold text-white transition-all focus:border-[var(--color-accent)]/50 focus:bg-white/[0.08] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              Amount (STX)
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-sm font-bold text-white transition-all focus:border-[var(--color-accent)]/50 focus:bg-white/[0.08] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] py-4 text-sm font-black text-[#0A0A0A] transition-all hover:bg-opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Confirm & Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

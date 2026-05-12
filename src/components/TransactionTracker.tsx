'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, ExternalLink, ChevronDown, Trash2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../lib/store';
import { clearTransactions } from '../lib/features/txSlice';
import { APP_CONFIG } from '../lib/config';

export default function TransactionTracker() {
  const { transactions, pendingCount } = useSelector((state: RootState) => state.tx);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getExplorerUrl = (txId: string) => {
    return `https://explorer.hiro.so/txid/${txId}?chain=${APP_CONFIG.isMainnet ? 'mainnet' : 'testnet'}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 px-4 flex items-center gap-3 rounded-xl border transition-all ${
          pendingCount > 0 
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
            : 'bg-white/[0.03] border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
        }`}
      >
        <Activity className={`h-4 w-4 ${pendingCount > 0 ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {pendingCount > 0 ? `${pendingCount} Processing` : 'Transactions'}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[380px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
               <h3 className="text-xs font-black text-white uppercase tracking-widest">On-Chain Ledger</h3>
               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Stacks Mainnet Node</p>
            </div>
            <button 
              onClick={() => dispatch(clearTransactions())}
              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-700 hover:text-red-500 transition-all"
            >
               <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-30">
                 <Activity className="h-12 w-12 text-gray-500" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No Recent Transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {transactions.map((tx) => (
                  <div 
                    key={tx.txId} 
                    className="p-6 hover:bg-white/[0.02] transition-colors group flex items-start gap-4"
                  >
                    <div className="mt-1">
                       {tx.status === 'pending' ? (
                         <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-indigo-500 animate-spin" />
                         </div>
                       ) : tx.status === 'success' ? (
                         <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                         </div>
                       ) : (
                         <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-500" />
                         </div>
                       )}
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                       <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">{tx.type}</p>
                          <a 
                            href={getExplorerUrl(tx.txId)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-gray-700 hover:text-indigo-400 transition-colors"
                          >
                             <ExternalLink className="h-3 w-3" />
                          </a>
                       </div>
                       <p className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">{tx.txId}</p>
                       <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                             {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            tx.status === 'pending' ? 'text-indigo-500 animate-pulse' : 
                            tx.status === 'success' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {tx.status}
                          </span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white/[0.01] border-t border-white/5">
             <button className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-all">
                Open Stacks Explorer
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

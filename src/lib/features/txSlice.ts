import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logError, logInfo } from '../utils/logger';
import { isValidTxId } from '../utils/validation';

export interface Transaction {
  txId: string;
  status: 'pending' | 'success' | 'failed';
  type: string;
  timestamp: string;
  amount?: number;
}

interface TxState {
  transactions: Transaction[];
  pendingCount: number;
}

const initialState: TxState = {
  transactions: [],
  pendingCount: 0,
};

const MAX_TRANSACTIONS = 200;

const txSlice = createSlice({
  name: 'tx',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const tx = action.payload;
      if (!tx || !tx.txId || !isValidTxId(tx.txId)) {
        logError('txSlice', 'Attempted to add invalid transaction', { tx });
        return;
      }

      // prevent duplicates
      if (state.transactions.find(t => t.txId === tx.txId)) {
        logInfo('txSlice', 'Duplicate transaction ignored', { txId: tx.txId });
        return;
      }

      state.transactions.unshift(tx);
      if (tx.status === 'pending') {
        state.pendingCount += 1;
      }

      // enforce max list size
      if (state.transactions.length > MAX_TRANSACTIONS) {
        state.transactions = state.transactions.slice(0, MAX_TRANSACTIONS);
      }
    },
    updateTransactionStatus: (state, action: PayloadAction<{ txId: string; status: 'success' | 'failed' }>) => {
      const { txId, status } = action.payload;
      if (!isValidTxId(txId)) {
        logError('txSlice', 'Invalid txId in updateTransactionStatus', { txId });
        return;
      }
      const tx = state.transactions.find(t => t.txId === txId);
      if (tx && tx.status === 'pending') {
        tx.status = status;
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      }
    },
    clearTransactions: (state) => {
      state.transactions = [];
      state.pendingCount = 0;
    },
  },
});

export const { addTransaction, updateTransactionStatus, clearTransactions } = txSlice.actions;
export default txSlice.reducer;

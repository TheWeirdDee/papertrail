import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const txSlice = createSlice({
  name: 'tx',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.status === 'pending') {
        state.pendingCount += 1;
      }
    },
    updateTransactionStatus: (state, action: PayloadAction<{ txId: string; status: 'success' | 'failed' }>) => {
      const tx = state.transactions.find(t => t.txId === action.payload.txId);
      if (tx && tx.status === 'pending') {
        tx.status = action.payload.status;
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

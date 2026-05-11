import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Post } from '@/lib/types';
import { logout } from './userSlice';
import { supabase, getSupaClient } from '@/lib/supabase';

interface PostsState {
  feed: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastCursor: string | null;
}

const initialState: PostsState = {
  feed: [],
  isLoading: false,
  error: null,
  hasMore: true,
  lastCursor: null,
};


export const fetchPostsFromSupabase = createAsyncThunk(
  'posts/fetchFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('gm_session_token');
      const response = await fetch('/api/posts/feed?limit=20', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch feed');
      const data = await response.json();
      return {
        posts: data.posts,
        nextCursor: data.nextCursor
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);


export const fetchPaginatedPosts = createAsyncThunk(
  'posts/fetchMore',
  async (cursor: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('gm_session_token');
      const response = await fetch(`/api/posts/feed?limit=20&cursor=${cursor}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch more posts');
      const data = await response.json();
      return {
        posts: data.posts,
        nextCursor: data.nextCursor
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createRealPost = createAsyncThunk(
  'posts/createReal',
  async (postData: { 
    address: string, 
    content: string, 
    mediaUrl?: string, 
    pollData?: any,
    isPro: boolean,
    txId?: string
  }, { rejectWithValue, dispatch }) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: Post = {
      id: tempId,
      authorAddress: postData.address,
      content: postData.content,
      timestamp: new Date().toISOString(),
      txId: postData.txId,
      reactions: { gm: 0, fire: 0, laugh: 0 },
      commentsCount: 0,
      repostsCount: 0,
      points: 0,
      isPro: postData.isPro,
      mediaUrl: postData.mediaUrl,
      pollData: postData.pollData,
    };


    dispatch(addOptimisticPost(optimisticPost));

    try {
      const token = localStorage.getItem('gm_session_token');
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: postData.content,
          txId: postData.txId,
          mediaUrl: postData.mediaUrl,
          pollData: postData.pollData,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        const errMsg = errData.error || 'Failed to create post';
        
        if (errMsg.toLowerCase().includes('exp') || errMsg.toLowerCase().includes('unauthorized') || response.status === 401) {
          dispatch(logout());
          throw new Error('Your session has expired. Please sign in again.');
        }

        throw new Error(errMsg);
      }

      const { data } = await response.json();
      

      return { tempId, realPost: data };
    } catch (err: any) {

      dispatch(removeOptimisticPost(tempId));
      return rejectWithValue(err.message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addOptimisticPost: (state, action: PayloadAction<Post>) => {
      state.feed = [action.payload, ...state.feed];
    },
    removeOptimisticPost: (state, action: PayloadAction<string>) => {
      state.feed = state.feed.filter(p => p.id !== action.payload);
    },
    addRealtimePost: (state, action: PayloadAction<Post>) => {
      if (!state.feed.find(p => p.id === action.payload.id)) {
        state.feed = [action.payload, ...state.feed];
      }
    },
    reactToPost: (state, action: PayloadAction<{ postId: string; reactionType: 'gm' | 'fire' | 'laugh'; decrement?: boolean }>) => {
      const { postId, reactionType, decrement } = action.payload;
      const post = state.feed.find(p => p.id === postId);
      if (post) {
        if (!post.reactions) {
          post.reactions = { gm: 0, fire: 0, laugh: 0 };
        }
        
        if (decrement) {
           post.reactions[reactionType] = Math.max(0, post.reactions[reactionType] - 1);
        } else {
           post.reactions[reactionType]++;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostsFromSupabase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPostsFromSupabase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feed = action.payload.posts;
        state.lastCursor = action.payload.nextCursor;
        state.hasMore = !!action.payload.nextCursor;
      })
      .addCase(fetchPostsFromSupabase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPaginatedPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPaginatedPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feed = [...state.feed, ...action.payload.posts];
        state.lastCursor = action.payload.nextCursor;
        state.hasMore = !!action.payload.nextCursor;
      })
      .addCase(createRealPost.fulfilled, (state, action) => {
        const { tempId, realPost } = action.payload as any;
        const index = state.feed.findIndex(p => p.id === tempId);
        if (index !== -1) {
          state.feed[index] = {
            ...state.feed[index],
            id: realPost.id,
            timestamp: realPost.created_at
          };
        }
      });
  },
});

export const { addOptimisticPost, removeOptimisticPost, addRealtimePost, reactToPost } = postsSlice.actions;
export default postsSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Post } from '@/lib/types';
import { logout } from './userSlice';
import { supabase, getSupaClient } from '@/lib/supabase';
import { isValidToken, isValidUrl, sanitizeInput } from '../utils/validation';
import { logError, logInfo } from '../utils/logger';

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
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('gm_session_token');
      if (!token || !isValidToken(token)) return { posts: [], nextCursor: null };

      const response = await fetch('/api/posts/feed?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logError('fetchPostsFromSupabase', 'Feed fetch failed', { status: response.status, body: text });
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json().catch((e: any) => {
        logError('fetchPostsFromSupabase', 'Invalid JSON from feed', e);
        return { posts: [], nextCursor: null };
      });

      return {
        posts: Array.isArray(data.posts) ? data.posts : [],
        nextCursor: data.nextCursor || null
      };
    } catch (err: any) {
      if (err.message.toLowerCase().includes('invalid compact jws')) {
        dispatch(logout());
      }
      return rejectWithValue(err.message);
    }
  }
);


export const fetchPaginatedPosts = createAsyncThunk(
  'posts/fetchMore',
  async (cursor: string, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('gm_session_token');
      if (!token || !isValidToken(token)) return { posts: [], nextCursor: null };

      const response = await fetch(`/api/posts/feed?limit=20&cursor=${encodeURIComponent(cursor)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logError('fetchPaginatedPosts', 'Failed to fetch more posts', { status: response.status, body: text });
        throw new Error('Failed to fetch more posts');
      }

      const data = await response.json().catch((e: any) => {
        logError('fetchPaginatedPosts', 'Invalid JSON', e);
        return { posts: [], nextCursor: null };
      });

      return {
        posts: Array.isArray(data.posts) ? data.posts : [],
        nextCursor: data.nextCursor || null
      };
    } catch (err: any) {
      if (err.message.toLowerCase().includes('invalid compact jws')) {
        dispatch(logout());
      }
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


    // sanitize optimistic post content
    optimisticPost.content = sanitizeInput(optimisticPost.content, 5000);
    dispatch(addOptimisticPost(optimisticPost));

    try {
      const token = localStorage.getItem('gm_session_token');
      if (!token || !isValidToken(token)) {
        throw new Error('No valid session token found. Please sign in again.');
      }

      // validate content length
      const safeContent = sanitizeInput(postData.content, 5000);
      if (!safeContent || safeContent.length === 0) {
        throw new Error('Content is invalid or empty');
      }

      // validate media URL if provided
      if (postData.mediaUrl && !isValidUrl(postData.mediaUrl)) {
        throw new Error('Invalid media URL');
      }

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
        const body = await response.text().catch(() => '');
        logError('createRealPost', 'Create post failed', { status: response.status, body });

        if (response.status === 401 || body.toLowerCase().includes('unauthorized') || body.toLowerCase().includes('invalid compact jws')) {
          dispatch(logout());
          throw new Error('Your session has expired. Please sign in again.');
        }

        const parsed = await (async () => {
          try { return JSON.parse(body); } catch { return null; }
        })();

        const errMsg = parsed?.error || parsed?.message || 'Failed to create post';
        throw new Error(errMsg);
      }

      const parsedResp = await response.json().catch((e: any) => {
        logError('createRealPost', 'Invalid JSON response', e);
        return null;
      });
      const { data } = parsedResp || { data: null };
      

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
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.feed = action.payload;
    },
    addPost: (state, action: PayloadAction<Post>) => {
      if (!state.feed.find(p => p.id === action.payload.id)) {
        state.feed = [action.payload, ...state.feed];
      }
    },
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

export const { setPosts, addPost, addOptimisticPost, removeOptimisticPost, addRealtimePost, reactToPost } = postsSlice.actions;
export default postsSlice.reducer;

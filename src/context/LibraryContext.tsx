import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  coverUrl: string;
  rating: number;
  ratingCount: number;
  salesCount: number;
  isTrending: boolean;
  aiSummary?: string;
}

export interface CartItem {
  bookId: string;
  quantity: number;
}

export interface Order {
  _id: string;
  invoiceNo: string;
  userId: string;
  username: string;
  email: string;
  items: Array<{
    bookId: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
    coverUrl: string;
  }>;
  totalAmount: number;
  status: 'Pending' | 'processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Stripe' | 'Razorpay' | 'COD';
  paymentStatus: 'Paid' | 'Unpaid' | 'Failed';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface AIRecommendation {
  book: Book;
  reason: string;
}

interface LibraryContextType {
  books: Book[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  aiPersonalized: AIRecommendation[];
  loadingBooks: boolean;
  loadingCart: boolean;
  loadingWishlist: boolean;
  loadingOrders: boolean;
  loadingAI: boolean;
  
  fetchBooks: (category?: string, query?: string) => Promise<void>;
  addToCart: (bookId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateCartQty: (bookId: string, qty: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (bookId: string) => Promise<{ success: boolean; error?: string }>;
  toggleWishlist: (bookId: string) => Promise<{ success: boolean; isWishlisted?: boolean; error?: string }>;
  placeOrder: (shippingAddress: any, paymentMethod: 'Stripe' | 'Razorpay' | 'COD') => Promise<{ success: boolean; order?: Order; error?: string }>;
  fetchUserOrders: () => Promise<void>;
  fetchAIPersonalized: () => Promise<void>;
  getAISimilar: (bookId: string) => Promise<Book[]>;
  getAISearchSuggestions: (query: string) => Promise<{ correctedQuery: string; recommendations: string[]; keywords: string[] }>;
  clearSessionState: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [aiPersonalized, setAiPersonalized] = useState<AIRecommendation[]>([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  const clearSessionState = () => {
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setAiPersonalized([]);
  };

  // Fetch standard books catalog
  const fetchBooks = async (category = 'All', query = '') => {
    setLoadingBooks(true);
    try {
      let url = `/api/books?category=${category}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (e) {
      console.error("Error loading books list:", e);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Fetch active user's cart
  const fetchCart = async () => {
    if (!token) return;
    setLoadingCart(true);
    try {
      const res = await fetch('/api/cart', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCart(data.items || []);
      }
    } catch (e) {
      console.error("Error loading cart details:", e);
    } finally {
      setLoadingCart(false);
    }
  };

  // Fetch user's wishlist
  const fetchWishlist = async () => {
    if (!token) return;
    setLoadingWishlist(true);
    try {
      const res = await fetch('/api/wishlist', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.bookIds || []);
      }
    } catch (e) {
      console.error("Error loading wishlist details:", e);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // Fetch past orders
  const fetchUserOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      console.error("Error loading orders history:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch personalized AI recommendation drawer
  const fetchAIPersonalized = async () => {
    if (!token) return;
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/recommendations', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAiPersonalized(data || []);
      }
    } catch (e) {
      console.error("Error generating personalized recommendations shelf:", e);
    } finally {
      setLoadingAI(false);
    }
  };

  // Trigger loading cart, wishlist, orders on user change
  useEffect(() => {
    if (token) {
      fetchCart();
      fetchWishlist();
      fetchUserOrders();
      fetchAIPersonalized();
    } else {
      clearSessionState();
    }
  }, [token]);

  // Load books on init
  useEffect(() => {
    fetchBooks();
  }, []);

  // Cart operations
  const addToCart = async (bookId: string, quantity = 1) => {
    if (!token) {
      return { success: false, error: 'Login required. Please register or sign in to build your cart!' };
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ bookId, quantity })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      
      setCart(data.cart.items || []);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Offline cart add failure' };
    }
  };

  const updateCartQty = async (bookId: string, quantity: number) => {
    if (!token) return { success: false, error: 'Login required' };
    try {
      const res = await fetch(`/api/cart/${bookId}/quantity`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ quantity })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      setCart(data.cart.items || []);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Offline qty change failure' };
    }
  };

  const removeFromCart = async (bookId: string) => {
    if (!token) return { success: false, error: 'Login required' };
    try {
      const res = await fetch(`/api/cart/${bookId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      setCart(data.cart.items || []);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Offline delete cart item failure' };
    }
  };

  // Wishlist toggle
  const toggleWishlist = async (bookId: string) => {
    if (!token) {
      return { success: false, error: 'Login required to preserve wishlist items.' };
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      setWishlist(data.wishlist.bookIds || []);
      // re-trigger personalized AI recommendations because wishlist state changed
      fetchAIPersonalized();
      return { success: true, isWishlisted: data.isWishlisted };
    } catch (e: any) {
      return { success: false, error: e.message || 'Offline wishlist failure' };
    }
  };

  // Checkout submit order
  const placeOrder = async (shippingAddress: any, paymentMethod: 'Stripe' | 'Razorpay' | 'COD') => {
    if (!token) return { success: false, error: 'Authorization error' };
    
    // Assemble cart item objects
    const itemsPayload = cart.map(item => ({
      bookId: item.bookId,
      quantity: item.quantity
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          items: itemsPayload,
          shippingAddress,
          paymentMethod,
          totalAmount: 0 // Backend recalculates strictly to enforce security!
        })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };

      // Success! Update local states
      setCart([]);
      setOrders(ordersList => [data.order, ...ordersList]);
      
      // refresh books (stock was decremented)
      fetchBooks();
      return { success: true, order: data.order };
    } catch (e: any) {
      return { success: false, error: e.message || 'Offline order placement error' };
    }
  };

  // Similar items retrieval
  const getAISimilar = async (bookId: string): Promise<Book[]> => {
    try {
      const res = await fetch(`/api/ai/similar/${bookId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("AI similar recall error:", e);
    }
    return [];
  };

  // Smart AI search query suggestions
  const getAISearchSuggestions = async (q: string) => {
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("AI search suggestion error:", e);
    }
    return { correctedQuery: q, recommendations: [], keywords: [] };
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        cart,
        wishlist,
        orders,
        aiPersonalized,
        loadingBooks,
        loadingCart,
        loadingWishlist,
        loadingOrders,
        loadingAI,
        fetchBooks,
        addToCart,
        updateCartQty,
        removeFromCart,
        toggleWishlist,
        placeOrder,
        fetchUserOrders,
        fetchAIPersonalized,
        getAISimilar,
        getAISearchSuggestions,
        clearSessionState
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be consumed inside a LibraryProvider');
  }
  return context;
};

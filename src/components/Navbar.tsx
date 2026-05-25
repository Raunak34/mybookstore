import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  ShoppingBag,
  Heart,
  User,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Info,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';

interface NavbarProps {
  currentColorMode: 'light' | 'dark';
  toggleColorMode: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClearSearchTrigger: () => void;
  onAISearchApplied: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentColorMode,
  toggleColorMode,
  activeTab,
  setActiveTab,
  onClearSearchTrigger,
  onAISearchApplied
}) => {
  const { user, logout } = useAuth();
  const { cart, wishlist, books, getAISearchSuggestions } = useLibrary();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search local states
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{ correctedQuery: string; recommendations: string[]; keywords: string[] } | null>(null);
  const [showAiSuggestPanel, setShowAiSuggestPanel] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  const cartCount = cart.reduce((temp, item) => temp + item.quantity, 0);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync back search suggestions with delay
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setAiSuggestions(null);
      setShowAiSuggestPanel(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingAI(true);
      try {
        const result = await getAISearchSuggestions(searchQuery);
        if (result && (result.correctedQuery !== searchQuery || result.recommendations.length > 0)) {
          setAiSuggestions(result);
          setShowAiSuggestPanel(true);
        } else {
          setAiSuggestions(null);
          setShowAiSuggestPanel(false);
        }
      } catch (err) {
        console.error("Failed loading search suggestions", err);
      } finally {
        setIsSearchingAI(false);
      }
    }, 700);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAiSuggestPanel(false);
    onAISearchApplied(searchQuery);
    setActiveTab('home');
  };

  const applyAISuggestion = (suggestionStr: string) => {
    setSearchQuery(suggestionStr);
    setShowAiSuggestPanel(false);
    onAISearchApplied(suggestionStr);
    setActiveTab('home');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAiSuggestions(null);
    setShowAiSuggestPanel(false);
    onClearSearchTrigger();
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-neutral-200/55 dark:border-white/5 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div
            onClick={() => { clearSearch(); setActiveTab('home'); }}
            className="flex cursor-pointer items-center gap-2.5 shrink-0"
          >
            <div className="flex items-center justify-center bg-zinc-900 dark:bg-gold text-gold dark:text-zinc-950 p-2.5 rounded-2xl shadow-lg shadow-gold/10 border border-white/5">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-serif italic text-zinc-900 dark:text-white tracking-tight flex items-center gap-0.5">
                your<span className="text-gold font-sans not-italic font-bold ml-1">bookstore</span>
                <Sparkles className="w-4 h-4 text-gold animate-pulse hidden md:inline-block" />
              </span>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Intelligence Discovery</p>
            </div>
          </div>

          {/* Search Bar Block with intelligent suggestions */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search by Title, Author or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-zinc-900/50 border border-neutral-200/60 dark:border-white/10 rounded-2xl py-2.5 pl-11 pr-10 text-sm font-medium text-neutral-800 dark:text-zinc-200 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:border-gold dark:focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              />
              <Search className="absolute left-4 top-3 h-4.5 wrapper-icon text-zinc-400 dark:text-zinc-500" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-2.5 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-bold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Smart suggestions dropdown */}
            {showAiSuggestPanel && aiSuggestions && (
              <div className="absolute top-[52px] left-0 w-full bg-white dark:bg-zinc-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-40 animate-fade-in text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-1.5 mb-2.5 text-gold font-bold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart Search Assist
                </div>

                {searchQuery !== aiSuggestions.correctedQuery && (
                  <div className="mb-3 p-2 bg-gold/10 rounded-xl border border-gold/20">
                    <span className="text-zinc-400 font-medium">Did you mean: </span>
                    <button
                      onClick={() => applyAISuggestion(aiSuggestions.correctedQuery)}
                      className="font-black text-gold hover:underline inline ml-1"
                    >
                      {aiSuggestions.correctedQuery}
                    </button>
                  </div>
                )}

                {aiSuggestions.recommendations.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-black tracking-wider text-zinc-400 uppercase mb-1.5">Recommended Books Matches</p>
                    <div className="flex flex-col gap-1.5">
                      {aiSuggestions.recommendations.map((recTitle, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyAISuggestion(recTitle)}
                          className="flex items-center gap-2 w-full text-left p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800/60 font-medium text-neutral-800 dark:text-zinc-105 hover:text-gold transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="line-clamp-1">{recTitle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 italic">No direct matches. Press Enter to search catalog database.</p>
                )}
              </div>
            )}
          </div>

          {/* Core Navigation Items */}
          <div className="hidden lg:flex items-center gap-1.5 list-none">
            <button
              onClick={() => { clearSearch(); setActiveTab('home'); }}
              className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                activeTab === 'home'
                  ? 'text-gold border-b-2 border-gold font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              BROWSE
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                activeTab === 'about'
                  ? 'text-gold border-b-2 border-gold font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ABOUT
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                activeTab === 'contact'
                  ? 'text-gold border-b-2 border-gold font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              CONTACT
            </button>
          </div>

          {/* Action Icons Panel */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            
            {/* Color Mode Toggle */}
            <button
              onClick={toggleColorMode}
              className="p-2.5 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0A0A0A] text-neutral-600 dark:text-zinc-400 hover:text-gold hover:scale-105 transition-all"
              title="Toggle Theme"
            >
              {currentColorMode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => setActiveTab('wishlist')}
              className="relative p-2.5 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0A0A0A] text-neutral-600 dark:text-zinc-400 hover:text-rose-500 hover:scale-105 transition-all"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white px-1">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative p-2.5 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-[#0A0A0A] text-neutral-600 dark:text-zinc-400 hover:text-gold hover:scale-105 transition-all animate-flicker-slow"
              title="My Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-black text-black px-1 shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800/80 mx-1 hidden md:block"></span>

            {/* User credentials drop down */}
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 font-bold text-gold flex items-center justify-center uppercase shadow-sm">
                    {user.username.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400 hidden sm:inline" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl bg-white dark:bg-[#0A0A0A] border border-neutral-200/80 dark:border-white/10 shadow-2xl p-2 z-40 animate-fade-in">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex flex-col">
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block">Logged in as</span>
                      <span className="text-sm font-extrabold text-neutral-900 dark:text-neutral-50 truncate leading-snug">{user.username}</span>
                      <span className="text-[10px] font-medium text-zinc-400 truncate mt-0.5">{user.email}</span>
                      
                      {/* Role indicator */}
                      <span className={`inline-block text-[9px] font-bold uppercase self-start px-2 py-0.5 mt-1.5 rounded ${
                        user.role === 'admin' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-neutral-100 dark:bg-zinc-805 text-zinc-400'
                      }`}>
                        {user.role} Account
                      </span>
                    </div>

                    <div className="py-1 flex flex-col gap-0.5">
                      <button
                        onClick={() => { setActiveTab('dashboard'); setUserDropdownOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800/60 transition-colors"
                      >
                        <User className="w-4 h-4 text-neutral-400" />
                        My Bookstore
                      </button>

                      <button
                        onClick={() => { setActiveTab('orders'); setUserDropdownOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800/60 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-neutral-400" />
                        My Order Status
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setActiveTab('admin_dashboard'); setUserDropdownOpen(false); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black text-gold hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          ADMIN CONSOLE
                        </button>
                      )}

                      <button
                        onClick={() => { logout(); setUserDropdownOpen(false); clearSearch(); setActiveTab('home'); }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors mt-1 border-t border-zinc-100 dark:border-white/5 pt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-zinc-100 font-bold px-4 py-2 rounded-xl text-xs tracking-wider shadow"
              >
                <User className="w-4 h-4" />
                LOGIN
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 ml-1 rounded-xl text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-900 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Sliding Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-zinc-950 border-t border-neutral-200/55 dark:border-white/5 px-4 py-4 flex flex-col gap-4 animate-slide-in">
          
          {/* Mobile Search input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search catalog books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-zinc-900 border border-neutral-200/60 dark:border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-neutral-800 dark:text-zinc-200 focus:outline-none focus:border-gold"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-2 text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Links stack */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { clearSearch(); setActiveTab('home'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase ${
                activeTab === 'home' ? 'bg-neutral-100 dark:bg-zinc-900/50 text-gold' : 'text-zinc-500'
              }`}
            >
              Browse Shop
            </button>
            <button
              onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase ${
                activeTab === 'about' ? 'bg-neutral-100 dark:bg-zinc-900/50 text-gold' : 'text-zinc-500'
              }`}
            >
              About
            </button>
            <button
              onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); }}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase ${
                activeTab === 'contact' ? 'bg-neutral-100 dark:bg-zinc-900/50 text-gold' : 'text-zinc-500'
              }`}
            >
              Contact
            </button>
            {user && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase ${
                    activeTab === 'dashboard' ? 'bg-neutral-100 dark:bg-zinc-900/50 text-gold' : 'text-zinc-500'
                  }`}
                >
                  My Bookstore Dashboard
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => { setActiveTab('admin_dashboard'); setMobileMenuOpen(false); }}
                    className="text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-gold/10 text-gold border border-gold/20"
                  >
                    Admin Console
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

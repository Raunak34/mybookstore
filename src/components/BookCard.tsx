import React from 'react';
import { Star, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Book } from '../context/LibraryContext';

interface BookCardProps {
  book: Book;
  onViewDetails: (book: Book) => void;
  onAddToCart: (bookId: string) => void;
  onToggleWishlist: (bookId: string) => void;
  isWishlisted: boolean;
  isAddedToCart: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewDetails,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  isAddedToCart
}) => {
  const isOutOfStock = book.stock <= 0;

  return (
    <div
      id={`book-card-${book._id}`}
      className="group relative bg-white/70 dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-neutral-200/50 dark:border-white/5 p-4 flex flex-col h-[440px] shadow-sm hover:shadow-2xl hover:border-gold/40 dark:hover:border-gold/40 transition-all duration-300 transform hover:-translate-y-1.5"
    >
      {/* Absolute Badges */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
        {book.isTrending && (
          <span className="flex items-center gap-1 bg-gold/20 border border-gold/30 text-xs font-semibold text-gold px-3 py-1 rounded-full shadow-lg">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Trending
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.2 rounded-full shadow">
            Out of Stock
          </span>
        )}
      </div>

      <button
        onClick={() => onToggleWishlist(book._id)}
        className={`absolute top-6 right-6 z-10 p-2.5 rounded-full backdrop-blur-md border shadow transition-all duration-300 ${
          isWishlisted
            ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 scale-110'
            : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 border-zinc-200/50 dark:border-zinc-700/50 hover:text-rose-500 hover:scale-110'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Book Cover Image Container */}
      <div
        onClick={() => onViewDetails(book)}
        className="cursor-pointer w-full h-52 overflow-hidden rounded-xl bg-neutral-100 dark:bg-zinc-800/50 mb-4 relative flex items-center justify-center group-hover:shadow-md transition-shadow"
      >
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover transform scale-100 group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // fallback if cover image url is broken or inaccessible
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=400';
          }}
        />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-gold text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs tracking-wider shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            QUICK VIEW
          </span>
        </div>
      </div>

      {/* Book Metadata */}
      <div className="flex flex-col flex-1">
        <span className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">
          {book.category}
        </span>
        
        <h3
          onClick={() => onViewDetails(book)}
          className="cursor-pointer text-base font-bold text-neutral-900 dark:text-white hover:text-gold dark:hover:text-gold transition-colors line-clamp-1 leading-snug tracking-tight mb-1"
          title={book.title}
        >
          {book.title}
        </h3>
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-2">
          by <span className="font-medium">{book.author}</span>
        </p>

        {/* Rating stars */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex gap-0.5" title={`${book.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(book.rating)
                    ? 'text-gold fill-current'
                    : 'text-neutral-300 dark:text-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-150 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            {book.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
            ({book.ratingCount || 10})
          </span>
        </div>

        {/* Price & Cart Actions */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400 dark:text-zinc-500 tracking-wider">PRICE</span>
            <span className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">
              ₹{book.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => !isOutOfStock && onAddToCart(book._id)}
            disabled={isOutOfStock}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 ${
              isOutOfStock
                ? 'bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed border border-neutral-200 dark:border-zinc-700'
                : isAddedToCart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                : 'bg-neutral-900 dark:bg-gold text-white dark:text-neutral-950 hover:bg-neutral-850 dark:hover:bg-gold-hover shadow-md hover:scale-[1.03] active:scale-95'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {isAddedToCart ? 'IN CART' : 'ADD'}
          </button>
        </div>
      </div>
    </div>
  );
};

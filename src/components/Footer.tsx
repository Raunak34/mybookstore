import React from 'react';
import { BookOpen, Github, Twitter, Linkedin, Sparkles, MapPin, Mail, PhoneCall } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-black/60 border-t border-white/5 text-zinc-400 py-16 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand block */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-gold text-zinc-950 p-2 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-lg font-serif italic text-white tracking-tight flex items-center gap-0.5">
                your<span className="text-gold font-sans not-italic font-bold ml-1">bookstore</span>
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              To find the best books out there within your budget.
            </p>

            {/* Social channels */}
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="p-2 bg-zinc-800/60 rounded-xl hover:text-white hover:bg-zinc-750 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-zinc-800/60 rounded-xl hover:text-white hover:bg-zinc-750 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-zinc-800/60 rounded-xl hover:text-white hover:bg-zinc-750 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">Discover Area</h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-500 font-semibold mb-4">
              <button onClick={() => setActiveTab('home')} className="text-left hover:text-white transition-colors cursor-pointer">
                Browse Catalog
              </button>
              <button className="text-left hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('about')}>
                Our Philosophy
              </button>
              <button className="text-left hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('about')}>
                The Tech Stack
              </button>
              <button className="text-left hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('contact')}>
                Terms of Service
              </button>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">Store Hours</h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-550 font-semibold">
              <p><span className="text-zinc-500">Mon - Fri:</span> 9:00 AM - 9:00 PM</p>
              <p><span className="text-zinc-500">Saturday:</span> 10:00 AM - 8:00 PM</p>
              <p><span className="text-zinc-500">Sunday:</span> 11:00 AM - 6:00 PM</p>
              <div className="flex items-center gap-1 bg-gold/10 text-gold px-2.5 py-1 rounded border border-gold/20 text-[10px] w-max font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Online Support 24/7
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">Secure Contacts</h4>
            <div className="flex flex-col gap-4 text-xs text-zinc-550 font-semibold">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>100 Innovation Parkway, Silicon Valley, CA, USA</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span>orders@bookstore.com</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-gold shrink-0" />
                <span>+1 (800) 555-BOOKS</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="border-t border-white/5 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-zinc-650 font-semibold uppercase tracking-wider">
          <p>© 2026 yourbookstore — Exclusive Reader Network.</p>
        </div>
      </div>
    </footer>
  );
};

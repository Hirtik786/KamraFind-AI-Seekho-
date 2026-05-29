import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Eye, GraduationCap, ArrowUpRight } from 'lucide-react';
import { Listing } from '../types';
import { formatPrice } from '../constants';

interface RecentlyViewedProps {
  listings: Listing[];
  onSelect: (listing: Listing) => void;
  lang: 'EN' | 'UR';
}

export default function RecentlyViewed({ listings, onSelect, lang }: RecentlyViewedProps) {
  if (listings.length === 0) return null;

  const t = {
    EN: {
      title: "Recently Visited Rooms",
      sub: "",
      rent: "Rs."
    },
    UR: {
      title: "Aapne Haali Mein Dekha",
      sub: "Wapis jald check karne ke liye click karen",
      rent: "Rs."
    }
  }[lang];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Eye className="w-4 h-4 text-primary animate-pulse" />
        <h3 className="text-xs font-black uppercase tracking-widest text-primary">
          {t.title} {t.sub && <span className="text-gray-400 font-medium normal-case">- {t.sub}</span>}
        </h3>
      </div>
      
      {/* Horizontal Scroll Layout */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
        {listings.map((l, idx) => (
          <motion.div
            key={`recent-view-${l.id || ''}-${idx}`}
            onClick={() => onSelect(l)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex gap-3 cursor-pointer shadow-sm hover:shadow-md transition-all group"
          >
            {/* Visual Indicator image placeholder */}
            <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-[10px] font-black shrink-0 text-primary dark:text-emerald-400 group-hover:bg-primary/5 transition-colors border border-gray-100 dark:border-gray-800">
              <span className="opacity-75">{l.type.split(' ')[0]}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mt-1">⭐ {l.rating || '4.2'}</span>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors pr-3 relative">
                  {l.title}
                  <ArrowUpRight className="w-3.5 h-3.5 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{l.area}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary dark:text-emerald-400">
                  {t.rent} {formatPrice(l.rent)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase">{l.gender}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

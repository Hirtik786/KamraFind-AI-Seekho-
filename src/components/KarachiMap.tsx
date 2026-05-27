import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Sparkles, Building2, School } from 'lucide-react';
import { Listing } from '../types';

interface KarachiMapProps {
  listings: Listing[];
  selectedArea: string;
  onSelectArea: (area: string) => void;
  lang: 'EN' | 'UR';
}

interface AreaCoord {
  name: string;
  x: number; // percentage width
  y: number; // percentage height
  academicHubs: string[];
}

const KARACHI_COORDS: AreaCoord[] = [
  { name: 'Gulshan-e-Iqbal', x: 55, y: 40, academicHubs: ['NED', 'Karachi University', 'Sir Syed'] },
  { name: 'Gulistan-e-Johar', x: 75, y: 35, academicHubs: ['Karachi University'] },
  { name: 'PECHS', x: 45, y: 60, academicHubs: ['IBA', 'SZABIST'] },
  { name: 'Clifton', x: 28, y: 82, academicHubs: ['Indus Valley', 'SZABIST'] },
  { name: 'Defence (DHA)', x: 48, y: 85, academicHubs: ['DHA Suffa', 'Bahria'] },
  { name: 'North Nazimabad', x: 35, y: 25, academicHubs: ['Ziauddin', 'Sir Syed'] },
  { name: 'Saddar', x: 25, y: 68, academicHubs: ['Dow Medical'] },
  { name: 'Scheme 33', x: 80, y: 15, academicHubs: ['Karachi University'] },
  { name: 'FB Area', x: 50, y: 22, academicHubs: ['Aga Khan'] },
  { name: 'Malir', x: 90, y: 62, academicHubs: ['Other'] }
];

export default function KarachiMap({ listings, selectedArea, onSelectArea, lang }: KarachiMapProps) {
  const getCount = (area: string) => {
    return listings.filter((l) => l.area.toLowerCase() === area.toLowerCase()).length;
  };

  const t = {
    EN: {
      title: "Interactive Interactive Room Map",
      desc: "Tap on any academic hub marker to view available roommate listings near Karachi's top universities.",
      roomsCount: "rooms listed",
      selected: "Currently Filtered:",
      all: "All of Karachi",
      clickPrompt: "Click an area to isolate listings immediately"
    },
    UR: {
      title: "Karachi Room Naqsha (Interactive Map)",
      desc: "University campuses ke qareeb available kamray dekhne ke liye neechay spots par click karen.",
      roomsCount: "rooms moujood hain",
      selected: "Selected Location:",
      all: "Poora Karachi",
      clickPrompt: "Listings dekhne ke liye kisi bhi ilaqay par click karen"
    }
  }[lang];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xl mt-1">
            {t.desc}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 dark:bg-emerald-900/10 px-4 py-2.5 rounded-xl border border-primary/10">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{t.selected}</span>
          <span className="text-xs font-black text-primary dark:text-emerald-400 uppercase">
            {selectedArea === 'Any' ? t.all : selectedArea}
          </span>
        </div>
      </div>

      {/* Styled Vector Map Board */}
      <div className="relative aspect-[16/10] md:aspect-[16/9] w-full bg-slate-50 dark:bg-slate-950 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Abstract futuristic gridlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

        {/* Dynamic Sea Shore Arc (Karachi Coastline Visual Indicator) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0,90 Q 30,85 45,100" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary dark:text-emerald-500 stroke-[0.3]" strokeDasharray="1 1" />
          <text x="15" y="93" className="fill-current text-primary dark:text-emerald-400 font-bold text-[2px] tracking-widest uppercase opacity-60">Arabian Sea</text>
        </svg>

        {/* Coordinate Spots */}
        {KARACHI_COORDS.map((coord) => {
          const count = getCount(coord.name);
          const isSelected = selectedArea === coord.name;
          return (
            <motion.button
              key={coord.name}
              onClick={() => onSelectArea(isSelected ? 'Any' : coord.name)}
              className="absolute group z-10"
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Ping Anchor Outer */}
              <div className="relative flex items-center justify-center">
                {count > 0 && (
                  <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-60 animate-ping duration-1000 ${
                    isSelected ? 'bg-primary dark:bg-emerald-500' : 'bg-primary/20 dark:bg-emerald-500/10'
                  }`} />
                )}
                
                {/* Marker Pin */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isSelected 
                    ? 'bg-primary text-white scale-125 ring-4 ring-primary/20 dark:ring-emerald-400/20' 
                    : 'bg-white text-primary border border-primary/20 dark:bg-slate-800 dark:text-emerald-400 hover:border-primary'
                }`}>
                  <MapPin className="w-4.5 h-4.5" />
                </div>

                {/* Info Overlay Box on Hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 min-w-[150px] bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 shadow-2xl z-30">
                  <p className="text-xs font-black uppercase tracking-wider">{coord.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 leading-none">
                    <School className="w-3 h-3 text-amber-400" />
                    {coord.academicHubs.slice(0, 2).join(', ')}
                  </p>
                  <div className="h-px bg-slate-800 my-1.5" />
                  <p className="text-[10px] font-bold text-emerald-450">
                    {count} {t.roomsCount}
                  </p>
                </div>

                {/* Underpin Label Label */}
                <span className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black rounded px-1.5 py-0.5 tracking-wider bg-slate-900 dark:bg-slate-800 shadow text-slate-100 ${
                  isSelected ? 'border-2 border-primary' : 'border border-transparent'
                }`}>
                  {coord.name} ({count})
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-center text-xs font-bold text-gray-400 tracking-wide">
        💡 {t.clickPrompt}
      </div>
    </div>
  );
}

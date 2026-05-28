import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Sparkles, 
  Building2, 
  School, 
  Bed, 
  GraduationCap, 
  X, 
  ChevronRight, 
  ExternalLink,
  Info,
  Phone,
  Bookmark,
  CheckCircle2,
  Map as MapIcon,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { Listing } from '../types';

interface KarachiMapProps {
  listings: Listing[];
  selectedArea: string;
  onSelectArea: (area: string) => void;
  lang: 'EN' | 'UR';
}

interface AreaCoord {
  name: string;
  x: number; // percentage width for the vector fallback
  y: number; // percentage height for the vector fallback
  lat: number; // real latitude on Google Maps
  lng: number; // real longitude on Google Maps
  academicHubs: string[];
}

const AREA_DATA: AreaCoord[] = [
  { name: 'Gulshan-e-Iqbal', x: 55, y: 40, lat: 24.9180, lng: 67.0971, academicHubs: ['NED', 'Karachi University', 'Sir Syed'] },
  { name: 'Gulistan-e-Johar', x: 75, y: 35, lat: 24.9107, lng: 67.1256, academicHubs: ['Karachi University'] },
  { name: 'PECHS', x: 45, y: 60, lat: 24.8682, lng: 67.0724, academicHubs: ['IBA', 'SZABIST'] },
  { name: 'Clifton', x: 28, y: 82, lat: 24.8138, lng: 67.0336, academicHubs: ['Indus Valley', 'SZABIST'] },
  { name: 'Defence (DHA)', x: 48, y: 85, lat: 24.8016, lng: 67.0681, academicHubs: ['DHA Suffa', 'Bahria'] },
  { name: 'North Nazimabad', x: 35, y: 25, lat: 24.9372, lng: 67.0409, academicHubs: ['Ziauddin', 'Sir Syed'] },
  { name: 'Saddar', x: 25, y: 68, lat: 24.8607, lng: 67.0244, academicHubs: ['Dow Medical'] },
  { name: 'Scheme 33', x: 80, y: 15, lat: 24.9922, lng: 67.1437, academicHubs: ['Karachi University'] },
  { name: 'FB Area', x: 50, y: 22, lat: 24.9312, lng: 67.0768, academicHubs: ['Aga Khan'] },
  { name: 'Malir', x: 90, y: 62, lat: 24.8951, lng: 67.1993, academicHubs: ['Other'] }
];

interface UniversityLocation {
  name: string;
  acronym: string;
  lat: number;
  lng: number;
  description: string;
}

const UNIVERSITIES: UniversityLocation[] = [
  { name: 'Karachi University', acronym: 'KU', lat: 24.9431, lng: 67.1216, description: 'Pakistan\'s largest state university.' },
  { name: 'NED University of Engineering & Tech', acronym: 'NED', lat: 24.9318, lng: 67.1118, description: 'Pakistan\'s premier engineering school.' },
  { name: 'IBA Karachi (Main Campus)', acronym: 'IBA', lat: 24.9421, lng: 67.1145, description: 'Leading business administration institute.' },
  { name: 'SZABIST Karachi Campus', acronym: 'SZABIST', lat: 24.8142, lng: 67.0620, description: 'Premium computing, social sciences and business school.' },
  { name: 'Sir Syed University of Engineering & Tech', acronym: 'SSUET', lat: 24.9142, lng: 67.0864, description: 'Gulshan Academic hotspot.' },
  { name: 'Aga Khan University Hospital', acronym: 'AKU', lat: 24.9312, lng: 67.0768, description: 'Global standard medical campus.' },
  { name: 'Ziauddin University', acronym: 'ZU', lat: 24.9482, lng: 67.0456, description: 'Renowned health and engineering hub.' },
  { name: 'Dow University of Health Sciences', acronym: 'DUHS', lat: 24.8598, lng: 67.0210, description: 'Historic medical university center.' }
];

// Read environment variable correctly
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

export default function KarachiMap({ listings, selectedArea, onSelectArea, lang }: KarachiMapProps) {
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [showUniversities, setShowUniversities] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 24.8900, lng: 67.0600 }); // Karachi Center
  const [mapZoom, setMapZoom] = useState(12);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Localization resources
  const t = {
    EN: {
      title: "Interactive Live Room Map",
      desc: "Interactive real-time map displaying secure roommate listings around Karachi's major universities, landmarks, and residential areas.",
      roomsCount: "rooms listed",
      selected: "Active Filter:",
      all: "Poora Karachi (All)",
      clickPrompt: "Interact with place markers to query, filter, and discover compatible rooms",
      showUni: "Show Academic Hotspots",
      keyAlertTitle: "Google Maps API Key Setup",
      keyAlertDesc: "For full real-world geographic visualization and nearby search, load your Google Maps Platform Key.",
      step1: "Get a Google Maps API Key from Google Cloud Console.",
      step2: "Click Settings (⚙️ gear icon, top-right corner) → Secrets.",
      step3: "Type GOOGLE_MAPS_PLATFORM_KEY and press Enter.",
      step4: "Paste your key, press Enter, and the app will reload instantly.",
      demoHeading: "Interactive Fallback View Active",
      demoSub: "Setting up your secret enables a gorgeous, fully navigable live map. In the meantime, use this precise neighborhood map tracker:",
      viewListings: "Explore listings in this neighborhood",
      nearbyUni: "Proximity Academic Hubs:",
      noRooms: "No rooms matching this neighborhood filter yet. Tap another area to explore!",
      rent: "Rent",
      whatsapp: "Contact Roommate/Owner",
      details: "View Room Details"
    },
    UR: {
      title: "Karachi Room Naqsha (Live Map)",
      desc: "Karachi ki mashoor universities ke qareeb available kamray aur flatmate options real map par dekhain.",
      roomsCount: "rooms moujood hain",
      selected: "Ilaqa (Location):",
      all: "Poora Karachi",
      clickPrompt: "Direct Google map par price markers aur universities par click karke search karen",
      showUni: "Universities ke Campus Dekhain",
      keyAlertTitle: "Google Maps API Key Ki Zaroorat Hai",
      keyAlertDesc: "Asli Google map par apne areas aur locations browse karne ke liye API key enter karke activate karein.",
      step1: "Google Cloud console se API Key hasil karein.",
      step2: "Settings (⚙️ gear icon, top-right par) par ja kar Secrets kholin.",
      step3: "Naam GOOGLE_MAPS_PLATFORM_KEY type karke Enter marain.",
      step4: "Apni key paste kar ke enter dabain, aur map foran chal paray ga.",
      demoHeading: "Fallback Interactive Map Active Hai",
      demoSub: "Apni key enter karne se live directions khul jayen ge. Filhal aap is high-quality map se kaam chala saken ge:",
      viewListings: "Is ilaqay ke available kamray dekhain",
      nearbyUni: "Nazdeek Academic Institutions:",
      noRooms: "Is ilaqay mein filhal koi kamra listed nahi hai. Bara-e-maharbani koi aur ilaqa check kijiye!",
      rent: "Kiraya",
      whatsapp: "Roommate se Raabta Karein",
      details: "Kamray ki Maalomaat"
    }
  }[lang];

  // Map area listings counts
  const getCount = (areaName: string) => {
    return listings.filter((l) => l.area.toLowerCase().trim() === areaName.toLowerCase().trim()).length;
  };

  // Listings with stable randomized offsets to spread them out slightly around their area centers on real map
  const geocodedListings = useMemo(() => {
    return listings.map((l) => {
      const areaName = l.area.toLowerCase().trim();
      const coordObj = AREA_DATA.find((a) => a.name.toLowerCase() === areaName);
      const base = coordObj ? { lat: coordObj.lat, lng: coordObj.lng } : { lat: 24.8607, lng: 67.0244 };
      
      // Compute a stable deterministic pseudo-random offset based on the numeric value of the ID
      const stringId = l.id || '1';
      const sumId = stringId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const latOffset = ((sumId % 13) - 6.5) * 0.0019; // ~150 meters offset
      const lngOffset = (((sumId >> 2) % 13) - 6.5) * 0.0019;

      return {
        ...l,
        lat: base.lat + latOffset,
        lng: base.lng + lngOffset
      };
    });
  }, [listings]);

  // Filter listings based on selected area
  const activeAreaListings = useMemo(() => {
    if (selectedArea === 'Any') return geocodedListings;
    return geocodedListings.filter(l => l.area.toLowerCase().trim() === selectedArea.toLowerCase().trim());
  }, [geocodedListings, selectedArea]);

  // Sync zoom and center when active selection triggers
  useEffect(() => {
    if (selectedArea !== 'Any') {
      const parentArea = AREA_DATA.find(a => a.name.toLowerCase() === selectedArea.toLowerCase().trim());
      if (parentArea) {
        setMapCenter({ lat: parentArea.lat, lng: parentArea.lng });
        setMapZoom(13.8);
      }
    } else {
      setMapCenter({ lat: 24.8900, lng: 67.0600 });
      setMapZoom(12);
    }
  }, [selectedArea]);

  // Handle center focus of single listings clicked from standard cards
  const focusListingOnMap = (l: Listing) => {
    const matched = geocodedListings.find(item => item.id === l.id);
    if (matched) {
      setMapCenter({ lat: matched.lat, lng: matched.lng });
      setMapZoom(15.5);
      setActiveListing(matched);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-5 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* 1. Header Information Column */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white flex items-center gap-2 tracking-tight">
            <MapIcon className="w-6 h-6 text-primary dark:text-emerald-400 animate-pulse" />
            {t.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
            {t.desc}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 dark:bg-emerald-900/15 px-4.5 py-2.5 rounded-2xl border border-primary/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400">{t.selected}</span>
          <span className="text-xs font-black text-primary dark:text-emerald-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-primary/10 shadow-sm">
            {selectedArea === 'Any' ? t.all : selectedArea}
          </span>
        </div>
      </div>

      {/* 2. Google Maps Interactive Map State */}
      {hasValidKey ? (
        <div className="relative w-full rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Main Map Box */}
          <div className="lg:col-span-8 h-[580px] w-full relative">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapId="DEMO_MAP_ID"
                onCenterChanged={(e) => {
                  if (e.detail.center) setMapCenter(e.detail.center);
                }}
                onZoomChanged={(e) => {
                  if (e.detail.zoom) setMapZoom(e.detail.zoom);
                }}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* 1. University Area Hotspots Marker */}
                {showUniversities && UNIVERSITIES.map((uni, idx) => (
                  <AdvancedMarker 
                    key={`uni-${idx}`} 
                    position={{ lat: uni.lat, lng: uni.lng }}
                    onClick={() => {
                      setMapCenter({ lat: uni.lat, lng: uni.lng });
                      setMapZoom(14.5);
                    }}
                  >
                    <div className="bg-amber-500/90 dark:bg-amber-600/95 hover:bg-amber-600 hover:scale-110 text-white rounded-full p-2.5 shadow-xl transition-all cursor-pointer flex items-center justify-center border-2 border-white">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-[9px] font-black max-w-0 overflow-hidden group-hover:max-w-xs transition-all tracking-wider font-mono ml-0 uppercase">{uni.acronym}</span>
                    </div>
                  </AdvancedMarker>
                ))}

                {/* 2. Room Listings Price Tag Marker Bubbles */}
                {geocodedListings.map((l) => {
                  const isListingActive = activeListing?.id === l.id;
                  const latVal = typeof l.lat === 'number' ? l.lat : 24.8900;
                  const lngVal = typeof l.lng === 'number' ? l.lng : 67.0600;

                  return (
                    <AdvancedMarker
                      key={`list-marker-${l.id}`}
                      position={{ lat: latVal, lng: lngVal }}
                      onClick={() => setActiveListing(l)}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1.5 rounded-full shadow-md text-xs font-black flex items-center gap-1 cursor-pointer transition-all border outline-none ${
                          isListingActive
                            ? 'bg-emerald-600 text-white border-white scale-110 ring-4 ring-emerald-400/30'
                            : 'bg-white hover:bg-emerald-50 text-gray-900 border-gray-200 dark:bg-slate-900 dark:text-emerald-400 dark:border-slate-800 hover:border-emerald-500 hover:scale-105'
                        }`}
                      >
                        <Bed className="w-3 h-3 text-emerald-500 select-none" />
                        <span className="font-mono">Rs. {(l.rent / 1000).toFixed(0)}K</span>
                      </motion.div>
                    </AdvancedMarker>
                  );
                })}

                {/* 3. InfoWindow Popup details of Currently selected AdvancedMarker */}
                {activeListing && (
                  <InfoWindow
                    position={{ 
                      lat: typeof activeListing.lat === 'number' ? activeListing.lat : 24.89, 
                      lng: typeof activeListing.lng === 'number' ? activeListing.lng : 67.06 
                    }}
                    onCloseClick={() => setActiveListing(null)}
                  >
                    <div className="p-3 max-w-[280px] text-gray-900 text-left space-y-2">
                      <div className="relative">
                        {activeListing.imageUrl ? (
                          <img 
                            src={activeListing.imageUrl} 
                            alt={activeListing.title} 
                            className="w-full h-24 object-cover rounded-xl shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-50 flex items-center justify-center rounded-xl">
                            <Building2 className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <span className="absolute top-2 right-2 bg-emerald-500 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full">
                          Rs. {activeListing.rent.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-black truncate text-gray-950 uppercase">{activeListing.title}</p>
                        <p className="text-[10px] text-gray-500 font-semibold">{activeListing.area} • Proximity near {activeListing.university}</p>
                      </div>

                      <div className="flex gap-1.5 flex-wrap pt-1 text-[9px] text-gray-500 font-bold uppercase">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">🧑‍💻 {activeListing.gender} Seats</span>
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">🛏️ {activeListing.seatsAvailable} Free</span>
                        {activeListing.wifi && <span className="bg-gray-100 px-1.5 py-0.5 rounded">⚡ WIFI</span>}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <a 
                          href={`https://wa.me/${activeListing.whatsappNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 grow bg-emerald-500 hover:bg-emerald-600 font-extrabold text-[10px] text-white py-1.5 rounded-xl transition-all shadow-sm"
                        >
                          <Phone className="w-3 h-3" />
                          {t.whatsapp}
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>

            {/* Quick Filter Control HUD directly on the map */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <button 
                onClick={() => setShowUniversities(!showUniversities)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[10.5px] font-black uppercase transition-all shadow-lg text-white ${
                  showUniversities 
                    ? 'bg-amber-500/90 border-amber-400 hover:bg-amber-600' 
                    : 'bg-slate-900/85 border-slate-700/80 hover:bg-slate-950'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                {t.showUni}
              </button>
            </div>
          </div>

          {/* Collapsible interactive matching lists panel on the right */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border-l border-gray-100 dark:border-slate-800 flex flex-col max-h-[580px] overflow-hidden">
            {/* Neighborhood header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {selectedArea === 'Any' ? t.all : selectedArea}
              </h4>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 leading-normal">
                {activeAreaListings.length} {t.roomsCount} available
              </p>
            </div>

            {/* Scrollable list items */}
            <div className="p-4 space-y-3.5 overflow-y-auto grow custom-scrollbar">
              {activeAreaListings.length > 0 ? (
                activeAreaListings.map((l) => {
                  const isSelected = activeListing?.id === l.id;
                  return (
                    <motion.div 
                      key={`mapview-card-${l.id}`}
                      whileHover={{ scale: 1.015 }}
                      onClick={() => focusListingOnMap(l)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 select-none ${
                        isSelected 
                          ? 'bg-emerald-500/5 dark:bg-emerald-900/5 border-emerald-500 shadow-md ring-1 ring-emerald-500/20' 
                          : 'bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-gray-100 dark:border-slate-800/80 shadow-xs'
                      }`}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-50 border dark:border-slate-800 relative">
                        {l.imageUrl ? (
                          <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Building2 className="w-6 h-6 m-auto absolute inset-0 text-gray-300" />
                        )}
                        {l.verified && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">
                            ✓
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="text-[11.5px] font-black text-gray-900 dark:text-white truncate uppercase leading-tight">{l.title}</h5>
                          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 shrink-0 font-mono">
                            Rs. {l.rent ? l.rent.toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold truncate">🎓 {l.university}</p>
                        
                        <div className="flex items-center justify-between pt-1 gap-1">
                          <span className="text-[8.5px] font-black uppercase text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {l.type}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                            <Bed className="w-2.5 h-2.5" />
                            {l.seatsAvailable} seats left
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 space-y-2 border-2 border-dashed border-gray-100 dark:border-slate-800/80 rounded-2xl">
                  <span className="text-xl">🏜️</span>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-bold leading-normal">
                    {t.noRooms}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* UI State when process.env.GOOGLE_MAPS_PLATFORM_KEY is missing/empty:
           Splits view to display Activation checklist + elegant fallback coordinate vector graphics */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Guide Activation Column on the left */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                  <Info className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  {t.keyAlertTitle}
                </h4>
              </div>

              <p className="text-[11.5px] text-gray-500 dark:text-slate-400 leading-relaxed">
                {t.keyAlertDesc}
              </p>

              {/* Sequential Setup Instruction Lists */}
              <div className="space-y-2.5 pt-2">
                {[
                  { text: t.step1 },
                  { text: t.step2 },
                  { text: t.step3 },
                  { text: t.step4 }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs text-gray-600 dark:text-slate-300">
                    <span className="w-5 h-5 bg-amber-500/10 text-amber-500 font-black flex items-center justify-center rounded-lg text-[10px] shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-[11px] leading-relaxed font-bold">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlighted Instruction Banner Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 text-[10.5px] text-amber-600 dark:text-amber-400 font-bold leading-normal list-none">
              ℹ️ After adding the <b>GOOGLE_MAPS_PLATFORM_KEY</b> secret variable, the Google Cloud container compiles &amp; reloads. Real maps with interactive price tags will render!
            </div>
          </div>

          {/* Fallback elegant, interactive vector coordinate map on the right to keep app perfectly playable */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="p-4 bg-primary/5 dark:bg-emerald-950/15 rounded-2xl border border-primary/10">
              <h5 className="text-xs font-black text-primary dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {t.demoHeading}
              </h5>
              <p className="text-[11px] text-gray-500 dark:text-slate-450 mt-1 leading-normal">
                {t.demoSub}
              </p>
            </div>

            {/* Falling back beautifully to vector outline mapping */}
            <div className="relative aspect-[16/10] md:aspect-[16/9.5] w-full bg-slate-950 dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center select-none">
              
              {/* Abstract futuristic mapping gridlines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1.1px,transparent_1.1px),linear-gradient(to_bottom,#334155_1.1px,transparent_1.1px)] opacity-30 bg-[size:4rem_4.5rem]" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

              {/* Arabian Sea coastline outline */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0,90 Q 30,85 45,100" fill="none" stroke="#10b981" strokeWidth="4" className="stroke-[0.3]" strokeDasharray="1.5 1.5" />
                <text x="14" y="94" className="fill-current text-white font-black text-[2.5px] tracking-[0.25em] uppercase opacity-55 font-mono">Arabian Sea Coordinates</text>
              </svg>

              {/* Clickable spot markers representation */}
              {AREA_DATA.map((coord) => {
                const count = getCount(coord.name);
                const isSelected = selectedArea.toLowerCase().trim() === coord.name.toLowerCase().trim();
                const isHovered = hoveredZone === coord.name;
                
                return (
                  <motion.button
                    key={`vector-node-${coord.name}`}
                    onClick={() => onSelectArea(isSelected ? 'Any' : coord.name)}
                    onMouseEnter={() => setHoveredZone(coord.name)}
                    onMouseLeave={() => setHoveredZone(null)}
                    className="absolute group z-10"
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative flex items-center justify-center">
                      {count > 0 && (
                        <span className={`absolute inline-flex h-8.5 w-8.5 rounded-full opacity-60 animate-ping duration-1000 ${
                          isSelected ? 'bg-emerald-500' : 'bg-emerald-500/10'
                        }`} />
                      )}
                      
                      {/* Interactive Pin Core */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xl transition-all border ${
                        isSelected 
                          ? 'bg-emerald-500 text-white border-emerald-400 scale-125 ring-4 ring-emerald-500/25' 
                          : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500 hover:bg-slate-850'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>

                      {/* Info overlay box on Hover node */}
                      <AnimatePresence>
                        {(isHovered || isSelected) && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none min-w-[170px] bg-slate-950/95 border border-slate-800 text-white rounded-2xl p-3 shadow-2xl z-30"
                          >
                            <div className="space-y-1">
                              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-450">{coord.name}</p>
                              <p className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1">
                                <School className="w-3 h-3 text-amber-500" />
                                {coord.academicHubs.slice(0, 2).join(', ')}
                              </p>
                            </div>
                            <div className="h-px bg-slate-800/80 my-2" />
                            <div className="text-[9.5px] font-black text-slate-100 flex items-center justify-between">
                              <span className="uppercase">{t.roomsCount}:</span>
                              <span className="text-emerald-450 font-mono text-[10.5px] bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-500/10">{count} rooms</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Permanent Mini Location String Underneath */}
                      <span className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black rounded px-1.5 py-0.5 tracking-widest uppercase bg-slate-900 border text-slate-300 font-mono transition-colors ${
                        isSelected ? 'border-emerald-500 text-emerald-400' : 'border-slate-800/80'
                      }`}>
                        {coord.name}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <div className="flex justify-center text-[10px] uppercase font-black text-gray-400 dark:text-gray-550 tracking-widest text-center">
              💡 {t.clickPrompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

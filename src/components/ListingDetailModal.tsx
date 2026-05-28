import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, School, Banknote, Users, Utensils, Check, Heart, 
  MessageCircle, Sparkles, Calendar, ShieldCheck, AlertTriangle, 
  Wifi, Bath, Car, Info, Star, ChevronLeft, ChevronRight, Phone, CheckCircle, Trash2 
} from 'lucide-react';
import { Listing, AccommodationType, GenderPreference } from '../types';

interface ListingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  onAskAi: (listing: Listing) => void;
  onContact: (listing: Listing) => void;
  onViewProfile: (userId: string) => void;
  lang: 'EN' | 'UR';
  matchScore: number;
  currentUserUid?: string;
  onDelete?: (listing: Listing) => void;
  onReport?: (listing: Listing) => void;
}

export default function ListingDetailModal({
  isOpen,
  onClose,
  listing,
  onAskAi,
  onContact,
  onViewProfile,
  lang,
  matchScore,
  currentUserUid,
  onDelete,
  onReport
}: ListingDetailModalProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Initialize saved state based on localStorage
  useEffect(() => {
    if (!listing) return;
    const saved = localStorage.getItem('kamraFind_savedRoomIds');
    if (saved) {
      try {
        const ids: string[] = JSON.parse(saved);
        setIsSaved(ids.includes(listing.id));
      } catch (e) {
        setIsSaved(false);
      }
    }
  }, [listing, isOpen]);

  if (!isOpen || !listing) return null;

  const mockImagesByHash = [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
  ];
  const charSum = listing.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const displayImages = (listing.images && listing.images.length > 0)
    ? listing.images
    : [listing.imageUrl || mockImagesByHash[charSum % mockImagesByHash.length]];

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const toggleSave = () => {
    const updatedState = !isSaved;
    setIsSaved(updatedState);
    const saved = localStorage.getItem('kamraFind_savedRoomIds');
    let ids: string[] = [];
    if (saved) {
      try { ids = JSON.parse(saved); } catch (e) {}
    }
    if (updatedState) {
      if (!ids.includes(listing.id)) ids.push(listing.id);
    } else {
      ids = ids.filter(i => i !== listing.id);
    }
    localStorage.setItem('kamraFind_savedRoomIds', JSON.stringify(ids));
  };

  // Pre-formatted Whatsapp link with Urdu/English prefilled messages
  const whatsappText = lang === 'EN' 
    ? `Salam! I found your listing "${listing.title}" on KamraFind. Is it still available?`
    : `Assalam-o-Alaikum! Maine KamraFind par aapki listing "${listing.title}" dekhi hai. Kya ye abhi khaali hai?`;
  
  const whatsappNumberClean = listing.whatsappNumber?.replace(/\+/g, '').replace(/[\s-]/g, '') || '';
  const whatsappUrl = `https://wa.me/${whatsappNumberClean.startsWith('0') ? '92' + whatsappNumberClean.slice(1) : whatsappNumberClean}?text=${encodeURIComponent(whatsappText)}`;

  // Translation helpers
  const t = {
    EN: {
      quickSpecs: "Quick Specs",
      amenities: "Amenities Checklist",
      questions: "Crucial Questions for Karachi Renters",
      scamWarning: "Always visit the property & inspect tenancy papers physically before transferring advance deposits. Avoid payment scams!",
      askAiContext: "Ask KamraFind AI about this room",
      rent: "Monthly Rent",
      deposit: "Security Deposit",
      type: "Room Type",
      university: "Closest Campus",
      area: "Sector / Area",
      gender: "Gender Guideline",
      roommates: "Roommates / Seats",
      moveIn: "Move-In Date",
      bills: "Utilities Charge",
      whatsApp: "WhatsApp Chat",
      inAppChat: "In-App Chat",
      ownerProfile: "View Owner Profile",
      description: "About this Accommodation",
      unspecified: "Not specified by student",
      verified: "KamraFind Verified Housing",
      compatNotes: "Aesthetic Compatibility Report",
      matchingHeading: "Why you'll love this place",
      askQ1: "Is water supplied from tanker or standard bor line?",
      askQ2: "Does this flat have an independent electrical sub-meter?",
      askQ3: "What is the policy for refund of advance security?",
      contactPublisher: "Contact Publisher"
    },
    UR: {
      quickSpecs: "Bunyadi Tafseelat",
      amenities: "Sohuliyat ki Checklist",
      questions: "Karachi mein Kiraye ke liye Zaroori Sawalaat",
      scamWarning: "Advance paise dene se pehle jagah ko khud jaakar check karen aur documents lazmi dekhein taake kisi kisam ka scam na ho!",
      askAiContext: "Is kamray ke baare mein AI se poochein",
      rent: "Mahana Kiraya",
      deposit: "Security Deposit",
      type: "Kamray ki Type",
      university: "Nazdeeki University",
      area: "Area / Location",
      gender: "Gender Shart",
      roommates: "Roommates / Seats",
      moveIn: "In Dinon se Khaali",
      bills: "Bijli / Gas Bills",
      whatsApp: "WhatsApp Rabta",
      inAppChat: "Chat Room",
      ownerProfile: "Owner ki Profile",
      description: "Accommodation ki Tafseelat",
      unspecified: "Maloomat faraham nahi ki gayi",
      verified: "کمرا فائنڈ تصدیق شدہ رہائش",
      compatNotes: "مطابقت کی رپورٹ",
      matchingHeading: "Ye jagah aap ke liye kyun behtar hai",
      askQ1: "Kya pani ka bhaar sarkari bor se aata hai ya tanker mangwana parta hai?",
      askQ2: "Kya is flat ka bijli ka sub-meter alag hai ya share hota hai?",
      askQ3: "Kiraya chornay ki surat mein security wapsi ki kya policy hai?",
      contactPublisher: "Rabta Karen"
    }
  }[lang];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        {/* Backdrop overlay filter blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Outer Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 25 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] border border-gray-100 dark:border-slate-800"
        >
          {/* Top navigation actions */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSave}
              className={`p-3 rounded-full backdrop-blur-md shadow-md focus:outline-none transition-all ${
                isSaved 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 dark:bg-slate-850 hover:bg-white text-gray-700 dark:text-gray-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </motion.button>
            <button 
              onClick={onClose} 
              className="p-3 bg-white/90 dark:bg-slate-850 hover:bg-white text-gray-700 dark:text-gray-300 rounded-full shadow-md focus:outline-none transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto outline-none flex-1">
            {/* 1. Carousel Gallery Header */}
            <div className="h-64 md:h-96 relative bg-slate-900 overflow-hidden flex items-center justify-center">
              <img 
                src={displayImages[activeImgIndex]} 
                alt={listing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

              {/* Verified Landlord Sticker */}
              {listing.verified && (
                <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
                  <span>{t.verified}</span>
                </div>
              )}

              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/45 hover:bg-black/65 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/45 hover:bg-black/65 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 backdrop-blur-xs px-2.5 py-1.5 rounded-full z-10">
                    {displayImages.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImgIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === activeImgIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Main title and rent placement */}
              <div className="absolute bottom-5 left-6 right-6 text-white text-left max-w-5xl">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow ${
                    listing.gender === 'Boys' ? 'bg-blue-600' : listing.gender === 'Girls' ? 'bg-pink-600' : 'bg-purple-600'
                  }`}>
                    {listing.gender === 'Any' ? 'Family/Any' : `${listing.gender} Only`}
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow">
                    {listing.type}
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-black tracking-tight drop-shadow-md leading-tight">{listing.title}</h2>
                <div className="flex items-center gap-1.5 text-gray-200 mt-2 text-xs md:text-sm drop-shadow">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{listing.area} · Near {listing.university}</span>
                </div>
              </div>
            </div>

            {/* 2. Double Column Grid content */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Left Column (Main specifications and metadata) */}
              <div className="lg:col-span-8 space-y-8">
                {/* 2.1 Aesthetic Compatibility Indicator Strip */}
                {matchScore >= 50 && (
                  <div className="bg-primary/5 dark:bg-emerald-500/5 border border-primary/10 dark:border-emerald-500/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-slate-800" fill="transparent" />
                        <circle 
                          cx="28" 
                          cy="28" 
                          r="24" 
                          stroke="#10b981" 
                          strokeWidth="4.5" 
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - matchScore / 100)}`}
                          fill="transparent" 
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-gray-900 dark:text-white">{matchScore}%</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{t.matchingHeading}</h4>
                      <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {matchScore >= 85 
                          ? (lang === 'EN' ? "Extreme high partner matches, closest vicinity & preferred bills parameters match." : "Aapki university ke bilkul qareeb aur features aapki requirements se bohot miltay hain.")
                          : (lang === 'EN' ? "Favorable location and compatible shared flat option." : "Acha option hai jo ke mutabiqa budget ke andar mil raha hai.")}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2.2 Bento Specs Grid */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400 mb-4">{t.quickSpecs}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-150/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t.rent}</p>
                      <p className="text-lg font-black text-primary dark:text-emerald-400 mt-2 font-mono">Rs. {listing.rent.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-1">per month</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-150/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t.deposit}</p>
                      <p className="text-lg font-black text-gray-800 dark:text-white mt-2 font-mono">Rs. {listing.securityDeposit?.toLocaleString() || '0'}</p>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-1">refundable</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-150/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t.roommates}</p>
                      <p className="text-lg font-black text-gray-800 dark:text-white mt-2 font-mono">{listing.seatsAvailable} / {listing.totalRoommates}</p>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-1">seats available</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-850 p-4 rounded-2xl border border-gray-150/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t.moveIn}</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white mt-2.5 truncate">{listing.moveInDate || 'Immediate'}</p>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">join timeline</p>
                    </div>
                  </div>
                </div>

                {/* 2.3 Description Segment */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400">{t.description}</h3>
                  <div className="bg-slate-50/50 dark:bg-slate-850 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-850">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line font-medium text-left">
                      {listing.description || t.unspecified}
                    </p>
                  </div>
                </div>

                {/* 2.4 Specs Details List */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-left">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-855">
                      <span className="text-gray-450 font-bold">{t.type}</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">{listing.type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-855">
                      <span className="text-gray-450 font-bold">{t.university}</span>
                      <span className="font-extrabold text-primary dark:text-emerald-400">{listing.university}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-855">
                      <span className="text-gray-450 font-bold">{t.area}</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">{listing.area}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-855">
                      <span className="text-gray-450 font-bold">{t.gender}</span>
                      <span className="font-extrabold text-gray-950 dark:text-gray-105">{listing.gender === 'Any' ? 'Family/Any' : listing.gender}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-855 sm:border-0">
                      <span className="text-gray-450 font-bold">{t.bills}</span>
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        {listing.utilities === 'Yes' 
                          ? (lang === 'EN' ? 'Included' : 'Kiraye mein shamil') 
                          : listing.utilities === 'Partial' 
                          ? (lang === 'EN' ? 'Shared Sub-Bill' : 'Aadha share') 
                          : (lang === 'EN' ? 'Separate Bill' : 'Alag se bill')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.5 Amenities Checklist grid */}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400 mb-4">{t.amenities}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                    {[
                      { icon: <Wifi className="w-4.5 h-4.5" />, title: "WiFi Broadband", active: listing.wifi },
                      { icon: <CheckCircle className="w-4.5 h-4.5" />, title: "Air Conditioning", active: listing.ac },
                      { icon: <CheckCircle className="w-4.5 h-4.5" />, title: "Fully Furnished", active: listing.furnished },
                      { icon: <Bath className="w-4.5 h-4.5" />, title: "Attached Bathroom", active: listing.attachedBath },
                      { icon: <Car className="w-4.5 h-4.5" />, title: "Protected Parking", active: listing.parking },
                      { icon: <Utensils className="w-4.5 h-4.5" />, title: "Meals Provided", active: listing.mealsIncluded },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all ${
                          item.active 
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-800 dark:text-emerald-400' 
                            : 'bg-gray-50/50 dark:bg-slate-850/50 border-gray-200/5 dark:border-slate-800 text-gray-400'
                        }`}
                      >
                        <div className={item.active ? 'text-emerald-600' : 'text-gray-400'}>
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold leading-normal">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2.6 Landlord Verification Scam Notice */}
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] p-6 border border-amber-500/15 flex items-start gap-3.5 text-left">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-400">Karachi Rental Safety Notice</h4>
                    <p className="text-xs leading-relaxed text-amber-700/85 dark:text-amber-300">{t.scamWarning}</p>
                  </div>
                </div>
              </div>

              {/* Right Column (Contact card and direct pre-rental questioning triggers) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Publisher Profile snapshot */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-6 text-center space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t.contactPublisher}</span>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-primary text-white flex items-center justify-center text-xl font-black shadow-md mb-2">
                      {listing.contactName?.charAt(0) || 'U'}
                    </div>
                    <h4 className="font-black text-base text-gray-950 dark:text-gray-100">{listing.contactName}</h4>
                    <p className="text-[10.5px] font-bold text-gray-400 block mt-0.5">Room & Accommodation Owner</p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={() => onViewProfile(listing.ownerId)}
                      className="w-full text-center text-xs font-extrabold text-primary hover:text-indigo-650 block hover:underline"
                    >
                      {t.ownerProfile} ➔
                    </button>
                    
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/10 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <Phone className="w-4 h-4 fill-white text-emerald-600" />
                      <span>{t.whatsApp}</span>
                    </a>

                    <button
                      onClick={() => onContact(listing)}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-primary dark:text-theme-highlight border-2 border-primary/10 text-primary font-black text-xs hover:border-primary/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span>{t.inAppChat}</span>
                    </button>
                    
                    <button
                      onClick={() => onAskAi(listing)}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.askAiContext}</span>
                    </button>

                    {currentUserUid === listing.ownerId ? (
                      <button
                        onClick={() => onDelete?.(listing)}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 font-black text-xs transition-all cursor-pointer border border-rose-200 dark:border-rose-900/40"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{lang === 'EN' ? 'Delete Listing' : 'Listing Khatam Karen'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onReport?.(listing)}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>{lang === 'EN' ? 'Report Listing' : 'Report Karen'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Karachi Crucial Tenants Check */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150/80 dark:border-slate-800 rounded-[2.5rem] p-6 space-y-4 text-left shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
                    <Info className="w-4 h-4 text-primary" /> {t.questions}
                  </h4>
                  <ul className="space-y-3.5">
                    {[
                      { q: t.askQ1, id: "water" },
                      { q: t.askQ2, id: "submeter" },
                      { q: t.askQ3, id: "refund" }
                    ].map((item, idx) => (
                      <li key={item.id} className="flex gap-2.5 items-start text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[9.5px] text-gray-500 shrink-0 font-mono mt-0.5">{idx + 1}</span>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{item.q}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

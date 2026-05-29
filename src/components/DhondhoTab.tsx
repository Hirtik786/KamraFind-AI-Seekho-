import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, School, Banknote, Users, Utensils, Info, Trash2, 
  ShieldCheck, User, Star, Filter, Heart, SlidersHorizontal, ArrowUpDown, 
  Plus, Check, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Map, List, MessageCircle, AlertCircle, X, Sparkles 
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { deleteDoc, doc, collection, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Listing, AccommodationType, GenderPreference } from '../types';
import { KARACHI_AREAS, UNIVERSITIES, formatPrice } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import ChatModal from './ChatModal';
import PublicProfileModal from './PublicProfileModal';
import CompareModal from './CompareModal';
import KarachiMap from './KarachiMap';
import RecentlyViewed from './RecentlyViewed';
import ListingDetailModal from './ListingDetailModal';

interface DhondhoTabProps {
  listings: Listing[];
  onAskAi: (listing: Listing) => void;
  onLoginClick: () => void;
  user: any;
  lang: 'EN' | 'UR';
  showSavedOnlyDefault?: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: {
    type: AccommodationType | 'Any';
    area: string;
    university: string;
    budget: number;
    gender: GenderPreference | 'Any';
    meals: string;
    furnishedOnly: boolean;
    wifiOnly: boolean;
    acOnly: boolean;
    attachedBathOnly: boolean;
    parkingOnly: boolean;
  };
}

const getListingImage = (l: Listing) => {
  if (l.images && l.images.length > 0) return l.images[0];
  if (l.imageUrl) return l.imageUrl;
  const charSum = (l.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackImages = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80"
  ];
  return fallbackImages[charSum % fallbackImages.length];
};

export default function DhondhoTab({ listings, onAskAi, onLoginClick, user, lang, showSavedOnlyDefault }: DhondhoTabProps) {
  // Translate system text
  const t = {
    EN: {
      findRoom: "Find Room / Roommate",
      subTitle: "Pakistan's premium Karachi roommate platform",
      reset: "Reset All",
      accommodation: "Accommodation Type",
      locality: "Locality / Area",
      nearUniversity: "Near University",
      monthlyBudget: "Monthly Budget",
      genderPref: "Gender Preference",
      mealsInc: "Meals Included",
      moreFilters: "More Filters",
      sortBy: "Sort By",
      sortNewest: "Newest Listings",
      sortPriceLow: "Price: Low to High",
      sortPriceHigh: "Price: High to Low",
      sortRating: "Top Rated ⭐",
      saveSearchBtn: "Save This Search",
      savedSearches: "My Saved Searches",
      matchingRooms: "matching rooms found",
      clearAllFilters: "Clear alright filters",
      noRooms: "No rooms matches your search limit.",
      noRoomsSub: "Try relaxing filters, toggling different universities or areas.",
      furnished: "Furnished Only",
      wifi: "WiFi Included",
      ac: "AC Included",
      attachedBath: "Attached Bath",
      parking: "Parking Space",
      compareNow: "Compare Now",
      compareSelected: "rooms selected",
      allTypes: "All Types",
      allKarachi: "All of Karachi",
      anyUni: "Any University",
      searchNamePlaceholder: "Save search as (e.g., FAST boys)...",
      savedAlert: "Search saved successfully!",
      alreadySaved: "This search configuration is already saved."
    },
    UR: {
      findRoom: "Kamra ya Roommate Dhondho",
      subTitle: "Karachi ka premium roommate platform",
      reset: "Reset Karen",
      accommodation: "Kamray Ki Type",
      locality: "Area / Location",
      nearUniversity: "University Ke Qareeb",
      monthlyBudget: "Mahana Budget",
      genderPref: "Gender Preference",
      mealsInc: "Khana Included?",
      moreFilters: "Mazeed Filters",
      sortBy: "Sort By",
      sortNewest: "Naye Listings",
      sortPriceLow: "Kiraya: Low se High",
      sortPriceHigh: "Kiraya: High se Low",
      sortRating: "Behtareen Rating ⭐",
      saveSearchBtn: "Is Search Ko Save Karen",
      savedSearches: "Mere Saved Searches",
      matchingRooms: "matching kamray milay",
      clearAllFilters: "Saray Filters Saaf Karen",
      noRooms: "Aapki search ke mutabiq koi kamra nahi mila.",
      noRoomsSub: "Filters ko thora behtar karen ya doosra area check karen.",
      furnished: "Furnished Only",
      wifi: "WiFi Included",
      ac: "AC Included",
      attachedBath: "Attached Bath",
      parking: "Parking Space",
      compareNow: "Abhi Compare Karen",
      compareSelected: "kamray select kiye hain",
      allTypes: "Saray Types",
      allKarachi: "Poora Karachi",
      anyUni: "Koi Bhi University",
      searchNamePlaceholder: "Search ka naam rakhen (e.g., FAST boys)...",
      savedAlert: "Search kamyabi se save ho gayi!",
      alreadySaved: "Yeh search setup pehle se saved hai."
    }
  }[lang];

  // 1. Core Filter States
  const [filters, setFilters] = useState({
    type: 'Any' as AccommodationType | 'Any',
    area: 'Any',
    university: 'Any',
    budget: 45000,
    gender: 'Any' as GenderPreference | 'Any',
    meals: 'Any',
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Hero stats & interactive items state
  const [statsData, setStatsData] = useState<{
    totalListings: number;
    totalUsers: number;
    averageRating: number;
    recentBooking: {
      userName: string;
      area: string;
      avatarUrl: string;
      price: number;
    } | null;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Popup notifications
  const [showPopup1, setShowPopup1] = useState(false);
  const [showPopup2, setShowPopup2] = useState(false);

  // Fetch Hero section stats
  useEffect(() => {
    let active = true;
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setStatsData(data);
          setStatsLoading(false);
        }
      })
      .catch(err => {
        console.error("Error loading stats:", err);
        if (active) {
          setStatsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [listings]);

  // Delayed trigger for notifications
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowPopup1(true);
    }, 1500);
    const timer2 = setTimeout(() => {
      setShowPopup2(true);
    }, 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // 1.2 More Filters states
  const [moreFilters, setMoreFilters] = useState({
    furnishedOnly: false,
    wifiOnly: false,
    acOnly: false,
    attachedBathOnly: false,
    parkingOnly: false,
  });

  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'topRated'>('newest');
  
  // 13. Mobile Bottom Sheet Filters Toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 3. Map / List toggle state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // 12. Show Saved listings constraint
  const [showSavedOnly, setShowSavedOnly] = useState(showSavedOnlyDefault || false);
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    setShowSavedOnly(showSavedOnlyDefault || false);
  }, [showSavedOnlyDefault]);

  const loadSavedRoomIds = () => {
    const saved = localStorage.getItem('kamraFind_savedRoomIds');
    if (saved) {
      try {
        setSavedRoomIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSavedRoomIds([]);
    }
  };

  useEffect(() => {
    loadSavedRoomIds();
    // Listen to changes globally
    const interval = setInterval(loadSavedRoomIds, 1500);
    return () => clearInterval(interval);
  }, []);

  // 4. Compare room IDs
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // 5. Recently Viewed room IDs (read/write from localStorage)
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);

  // 14. Full Details Popup states
  const [selectedDetailedListing, setSelectedDetailedListing] = useState<Listing | null>(null);

  // 15. Premium Custom Report & Delete overlay states
  const [reportingListing, setReportingListing] = useState<Listing | null>(null);
  const [reportReason, setReportReason] = useState<string>('Scam / Fake Listing');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportingSubmitting, setReportingSubmitting] = useState(false);

  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  const [deletingSubmitting, setDeletingSubmitting] = useState(false);
  const [deleteDone, setDeleteDone] = useState(false);

  // 8. Saved Searches states
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [showSavedSearchesDropdown, setShowSavedSearchesDropdown] = useState(false);

  // 12. Dismissible Auto-Rotating Banner tips
  const [tipIndex, setTipIndex] = useState(0);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const tips = [
    {
      en: "Advance dene se pehle ghar zaroor dekho! Always ask about extra charges: Gas, Pani, Security.",
      ur: "Advance dene se pehle kamra khud ja kar dekhen aur paani/gas ka pata karein!"
    },
    {
      en: "Sign a simple written agreement with the landlord to safeguard your deposit and terms.",
      ur: "Security deposit bachane ke liye landlord ke sath written agreement zaroor sign karein!"
    },
    {
      en: "Take a senior hostel companion with you when verifying listings. Stay safe and avoid internet scams.",
      ur: "Kamra dekhte waqt apne kisi dost ya baray ko sath le kar jayen aur scams se bachein!"
    }
  ];

  // Load Saved Searches & Recently Viewed listings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kamraFind_savedSearches');
    if (saved) {
      try { setSavedSearches(JSON.parse(saved)); } catch (e) { console.error(e); }
    }

    const recentIds = localStorage.getItem('kamraFind_recentlyViewedIds');
    if (recentIds) {
      try {
        const ids: string[] = JSON.parse(recentIds);
        const resolved = ids.map(id => listings.find(l => l.id === id)).filter((l): l is Listing => !!l);
        setRecentlyViewed(resolved.slice(0, 4));
      } catch (e) { console.error(e); }
    }
  }, [listings]);

  // Rotate between 3 Tips automatically every 5 seconds
  useEffect(() => {
    if (!isBannerVisible) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isBannerVisible]);

  // Enrich Listings with deterministic extra features (rating, verified, bathroom, furnished, parking)
  const decoratedListings = React.useMemo(() => {
    return listings.map((l) => {
      // Create code deterministically based on title & rent
      const code = l.title.charCodeAt(0) + (l.title.charCodeAt(l.title.length - 1) || 0) + l.rent;
      const rating = (4.0 + (code % 10) / 10).toFixed(1);
      const verified = code % 2 === 0 || l.id === '2' || l.id === '14' || l.id === '6';
      const furnished = code % 3 === 0 || l.rent > 15000;
      const attachedBath = code % 2 === 0 || l.type === 'Single Room' || l.id === '12';
      const parking = code % 3 !== 0;

      return {
        ...l,
        rating: parseFloat(rating),
        verified,
        furnished,
        attachedBath,
        parking
      };
    });
  }, [listings]);

  // Filter listings
  const filteredListings = React.useMemo(() => {
    return decoratedListings.filter((l) => {
      // 12. Show Saved listings constraint
      if (showSavedOnly && !savedRoomIds.includes(l.id)) return false;

      // Hero search query match (case-insensitive on area, title, or university)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const areaOk = l.area && l.area.toLowerCase().includes(queryLower);
        const titleOk = l.title && l.title.toLowerCase().includes(queryLower);
        const uniOk = l.university && l.university.toLowerCase().includes(queryLower);
        if (!areaOk && !titleOk && !uniOk) {
          return false;
        }
      }

      const typeMatch = filters.type === 'Any' || l.type === filters.type;
      const areaMatch = filters.area === 'Any' || l.area === filters.area;
      const uniMatch = filters.university === 'Any' || l.university === filters.university;
      const budgetMatch = l.rent <= filters.budget;
      const genderMatch = filters.gender === 'Any' || l.gender === filters.gender;
      const mealsMatch = filters.meals === 'Any' || (filters.meals === 'Yes' ? l.mealsIncluded : !l.mealsIncluded);
      
      const furnishedMatch = !moreFilters.furnishedOnly || l.furnished;
      const wifiMatch = !moreFilters.wifiOnly || l.wifi;
      const acMatch = !moreFilters.acOnly || l.ac;
      const bathMatch = !moreFilters.attachedBathOnly || l.attachedBath;
      const parkingMatch = !moreFilters.parkingOnly || l.parking;

      return typeMatch && areaMatch && uniMatch && budgetMatch && genderMatch && mealsMatch && 
             furnishedMatch && wifiMatch && acMatch && bathMatch && parkingMatch;
    });
  }, [decoratedListings, filters, moreFilters, showSavedOnly, savedRoomIds, searchQuery]);

  // Sort filtered listings
  const sortedListings = React.useMemo(() => {
    const list = [...filteredListings];
    if (sortBy === 'priceAsc') {
      return list.sort((a, b) => a.rent - b.rent);
    } else if (sortBy === 'priceDesc') {
      return list.sort((a, b) => b.rent - a.rent);
    } else if (sortBy === 'topRated') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // Newest Default
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [filteredListings, sortBy]);

  // Save This Search handler
  const handleSaveSearch = () => {
    if (!newSearchName.trim()) return;
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: newSearchName.trim(),
      filters: { ...filters, ...moreFilters }
    };
    const updated = [newSearch, ...savedSearches].slice(0, 10);
    setSavedSearches(updated);
    localStorage.setItem('kamraFind_savedSearches', JSON.stringify(updated));
    setNewSearchName('');
    alert(t.savedAlert);
  };

  const applySavedSearch = (search: SavedSearch) => {
    setFilters({
      type: search.filters.type,
      area: search.filters.area,
      university: search.filters.university,
      budget: search.filters.budget,
      gender: search.filters.gender,
      meals: search.filters.meals,
    });
    setMoreFilters({
      furnishedOnly: search.filters.furnishedOnly || false,
      wifiOnly: search.filters.wifiOnly || false,
      acOnly: search.filters.acOnly || false,
      attachedBathOnly: search.filters.attachedBathOnly || false,
      parkingOnly: search.filters.parkingOnly || false,
    });
    setShowSavedSearchesDropdown(false);
  };

  const deleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('kamraFind_savedSearches', JSON.stringify(updated));
  };

  // 7. Dynamic Match Score generator
  const getMatchScore = (l: Listing) => {
    let score = 100;
    if (filters.type !== 'Any' && l.type !== filters.type) score -= 15;
    if (filters.area !== 'Any' && l.area !== filters.area) score -= 25;
    if (filters.university !== 'Any' && l.university !== filters.university) score -= 15;
    if (filters.gender !== 'Any' && l.gender !== filters.gender) score -= 25;
    if (filters.meals !== 'Any') {
      const match = filters.meals === 'Yes' ? l.mealsIncluded : !l.mealsIncluded;
      if (!match) score -= 10;
    }
    // Budget penalty
    if (l.rent > filters.budget) {
      const diff = l.rent - filters.budget;
      score -= Math.min(25, Math.floor(diff / 1000) * 2);
    }
    return Math.max(55, score);
  };

  // Add listing to Recently Viewed list
  const trackRecentViewing = (listing: Listing) => {
    const existing = recentlyViewed.filter(r => r.id !== listing.id);
    const updated = [listing, ...existing].slice(0, 4);
    setRecentlyViewed(updated);
    
    // Save IDs inside localStorage (reconstruct on reload)
    const ids = updated.map(r => r.id);
    localStorage.setItem('kamraFind_recentlyViewedIds', JSON.stringify(ids));
  };

  const [activeChat, setActiveChat] = useState<{receiverId: string, receiverName: string, listing: Listing} | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const handleContact = (listing: Listing) => {
    trackRecentViewing(listing);
    if (!user) {
      onLoginClick();
      return;
    }
    setActiveChat({
      receiverId: listing.ownerId,
      receiverName: listing.contactName,
      listing: listing
    });
  };

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(i => i !== id));
    } else {
      if (compareIds.length >= 3) {
        alert("Maximum 3 rooms can be compared side-by-side!");
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingListing) return;
    setReportingSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: user?.displayName || 'Anonymous Reporter',
        email: user?.email || 'anonymous-reporter@dhondho.pk',
        message: `[ROOM REPORT] ID: ${reportingListing.id} | Title: ${reportingListing.title} | Reason: ${reportReason} | Details: ${reportDetails || 'None provided'}`,
        createdAt: new Date().toISOString()
      });
      setReportSubmitted(true);
    } catch (err) {
      console.error("Error reporting listing:", err);
      alert("Report submit karte waqt masla hua. Please try again.");
    } finally {
      setReportingSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingListing) return;
    setDeletingSubmitting(true);
    try {
      await deleteDoc(doc(db, 'listings', deletingListing.id));
      setDeleteDone(true);
      setTimeout(() => {
        setDeletingListing(null);
        setDeleteDone(false);
        setSelectedDetailedListing(null);
      }, 1500);
    } catch (err) {
      console.error("Error deleting listing:", err);
      handleFirestoreError(err, OperationType.DELETE, `listings/${deletingListing.id}`);
    } finally {
      setDeletingSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ type: 'Any', area: 'Any', university: 'Any', budget: 45000, gender: 'Any', meals: 'Any' });
    setMoreFilters({ furnishedOnly: false, wifiOnly: false, acOnly: false, attachedBathOnly: false, parkingOnly: false });
  };

  // Filters Render Template (for both Desktop & slide-up Bottom Sheet)
  const renderFiltersForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Type Filter */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em] ml-1">{t.accommodation}</label>
          <div className="relative group">
            <select 
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              className="w-full bg-white dark:bg-slate-800 border-2 border-primary/5 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-primary/10 outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
            >
              <option value="Any">{t.allTypes}</option>
              <option value="Hostel">Hostel</option>
              <option value="Sharing Flat">Sharing Flat</option>
              <option value="Single Room">Single Room</option>
              <option value="Full Apartment">Full Apartment</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Area Filter */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em] ml-1">{t.locality}</label>
          <div className="relative group">
            <select 
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border-2 border-primary/5 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-primary/10 outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
            >
              <option value="Any">{t.allKarachi}</option>
              {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* University Filter */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em] ml-1">{t.nearUniversity}</label>
          <div className="relative group">
            <select 
              value={filters.university}
              onChange={(e) => setFilters({ ...filters, university: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border-2 border-primary/5 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-primary/10 outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
            >
              <option value="Any">{t.anyUni}</option>
              {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Budget Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em]">{t.monthlyBudget}</label>
            <span className="text-xs font-black text-primary dark:text-emerald-400 bg-primary/15 px-3 py-1 rounded-lg">Rs. {formatPrice(filters.budget)}</span>
          </div>
          <div className="px-1 pt-1">
            <input 
              type="range" 
              min="5000" 
              max="95000" 
              step="1000"
              value={filters.budget}
              onChange={(e) => setFilters({ ...filters, budget: parseInt(e.target.value) })}
              className="w-full h-2 bg-primary/25 rounded-lg appearance-none cursor-pointer accent-primary dark:accent-emerald-450"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
              <span>5k</span>
              <span>45k</span>
              <span>95k</span>
            </div>
          </div>
        </div>

        {/* Gender Filter */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em] ml-1">{t.genderPref}</label>
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-primary/5 dark:border-gray-700 shadow-inner">
            {(['Any', 'Boys', 'Girls'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilters({ ...filters, gender: g })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  filters.gender === g 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-102 z-10' 
                    : 'text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Meals Filter */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-primary dark:text-emerald-400 uppercase tracking-[0.15em] ml-1">{t.mealsInc}</label>
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border-2 border-primary/5 dark:border-gray-700 shadow-inner">
            {(['Any', 'Yes', 'No'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilters({ ...filters, meals: m })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  filters.meals === m 
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-102 z-10' 
                    : 'text-gray-500 dark:text-gray-300 hover:text-accent dark:hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Collapsible Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t.moreFilters}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showMoreFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-hidden"
            >
              {[
                { key: 'furnishedOnly', label: t.furnished },
                { key: 'wifiOnly', label: t.wifi },
                { key: 'acOnly', label: t.ac },
                { key: 'attachedBathOnly', label: t.attachedBath },
                { key: 'parkingOnly', label: t.parking },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMoreFilters({
                    ...moreFilters,
                    [item.key]: !moreFilters[item.key as keyof typeof moreFilters]
                  })}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    moreFilters[item.key as keyof typeof moreFilters]
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {moreFilters[item.key as keyof typeof moreFilters] ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Plus className="w-4 h-4 shrink-0 text-gray-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Searches Actions Panel */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          <input 
            type="text"
            placeholder={t.searchNamePlaceholder}
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            className="bg-white dark:bg-slate-800 border dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-semibold w-full sm:w-60 focus:outline-none"
          />
          <button
            onClick={handleSaveSearch}
            className="bg-primary text-white p-2.5 rounded-xl text-xs font-black shadow-lg shadow-primary/10 hover:brightness-110 shrink-0 cursor-pointer"
            title="Safar Filters Configuration"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Saved dropdown selection */}
        {savedSearches.length > 0 && (
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowSavedSearchesDropdown(!showSavedSearchesDropdown)}
              className="w-full sm:w-60 bg-white dark:bg-slate-800 border dark:border-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-between shadow-sm cursor-pointer"
            >
              <span>{t.savedSearches} ({savedSearches.length})</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            <AnimatePresence>
              {showSavedSearchesDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-white dark:bg-slate-900 border dark:border-gray-800 rounded-2xl shadow-xl p-2 z-50 divide-y dark:divide-gray-800"
                >
                  {savedSearches.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => applySavedSearch(s)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-820 transition-all rounded-xl cursor-pointer flex items-center justify-between gap-1 group text-xs font-semibold"
                    >
                      <span className="truncate pr-1 group-hover:text-primary transition-colors text-gray-800 dark:text-slate-100">{s.name}</span>
                      <button
                        onClick={(e) => deleteSavedSearch(s.id, e)}
                        className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KamraFind Full-width Animated Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-neutral-50/90 to-emerald-50/60 dark:from-[#0B2519] dark:via-[#092217] dark:to-[#04150E] text-emerald-950 dark:text-white rounded-[2.5rem] px-6 py-10 md:p-12 border border-emerald-100 dark:border-emerald-900/30 shadow-xl dark:shadow-2xl mb-4"
      >
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-800/15 blur-3xl"
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Top Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/60 dark:bg-[#164D36] border border-emerald-200 dark:border-[#1E6044] text-[11px] font-bold text-emerald-800 dark:text-emerald-400 font-mono tracking-wider shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Karachi ka #1 Roommate Platform
            </motion.div>

            {/* Tagline / Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight"
            >
              Ghar se door, <br />
              phir bhi <span className="text-[#F59E0B]">ghar jaisa feel</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-emerald-800/80 dark:text-white/80 text-xs sm:text-sm leading-relaxed max-w-xl"
            >
              Karachi ke har area mein verified kamray aur safe roommates — students, professionals, aur families ke liye
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xl flex items-center gap-2 border border-emerald-100 dark:border-emerald-950/20"
            >
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search className="w-4 h-4 text-emerald-700 shrink-0 animate-pulse" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Area dhoondo — DHA, Gulshan, Clifton..."
                  className="w-full text-xs font-semibold text-[#0F3D2A] dark:text-white placeholder-emerald-900/40 dark:placeholder-slate-400 bg-transparent outline-none py-1.5"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-emerald-900/40 dark:text-white/45 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#0F3D2A] dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  const itemsElement = document.getElementById("room-listings-section");
                  if (itemsElement) {
                    itemsElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-[#0F3D2A] dark:bg-emerald-600 text-white hover:bg-emerald-950 dark:hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-md shrink-0 flex items-center gap-1 hover:text-[#F59E0B]"
              >
                Dhoondo →
              </button>
            </motion.div>

            {/* Trust Row */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-emerald-900/90 dark:text-white/90 pt-1"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 font-bold" />
                </div>
                <span>{listings.length}+ Listings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 font-bold" />
                </div>
                <span>{decoratedListings.filter(l => l.verified).length}+ Verified Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 font-bold" />
                </div>
                <span>Free to Use</span>
              </div>
            </motion.div>
          </div>

          {/* Right Floating Cards & Stats Column */}
          <div className="lg:col-span-5 flex flex-col gap-5 relative">
            {/* Quick Stats Grid Overlay */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-3 gap-3 w-full"
            >
              {/* Stat 1 */}
              <div className="bg-emerald-100/30 hover:bg-emerald-100/50 dark:bg-[#124b33]/40 dark:hover:bg-[#124b33]/60 transition-all border border-emerald-250/20 dark:border-[#1e6344]/30 backdrop-blur-md rounded-2xl p-2.5 text-center flex flex-col justify-center shadow-md dark:shadow-lg">
                <span className="text-lg font-black text-[#F59E0B]">
                  {statsLoading ? (
                    <div className="w-10 h-5 bg-emerald-950/40 animate-pulse rounded mx-auto" />
                  ) : (
                    statsData?.totalListings || 0
                  )}
                </span>
                <span className="text-[10px] text-emerald-800/80 dark:text-white/70 font-bold uppercase tracking-wider mt-1 leading-none">Active Listings</span>
              </div>

              {/* Stat 2 */}
              <div className="bg-emerald-100/30 hover:bg-emerald-100/50 dark:bg-[#124b33]/40 dark:hover:bg-[#124b33]/60 transition-all border border-emerald-250/20 dark:border-[#1e6344]/30 backdrop-blur-md rounded-2xl p-2.5 text-center flex flex-col justify-center shadow-md dark:shadow-lg">
                <span className="text-lg font-black text-[#F59E0B]">
                  {statsLoading ? (
                    <div className="w-10 h-5 bg-emerald-950/40 animate-pulse rounded mx-auto" />
                  ) : (
                    statsData?.totalUsers || 0
                  )}
                </span>
                <span className="text-[10px] text-emerald-800/80 dark:text-white/70 font-bold uppercase tracking-wider mt-1 leading-none">Registered Users</span>
              </div>

              {/* Stat 3 */}
              <div className="bg-emerald-100/30 hover:bg-emerald-100/50 dark:bg-[#124b33]/40 dark:hover:bg-[#124b33]/60 transition-all border border-emerald-250/20 dark:border-[#1e6344]/30 backdrop-blur-md rounded-2xl p-2.5 text-center flex flex-col justify-center shadow-md dark:shadow-lg">
                <span className="text-lg font-black text-[#F59E0B] flex items-center justify-center gap-0.5">
                  {statsLoading ? (
                    <div className="w-10 h-5 bg-emerald-950/40 animate-pulse rounded mx-auto" />
                  ) : (
                    <>
                      {statsData?.averageRating || 4.7}
                      <span className="text-xs text-[#F59E0B]">★</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-emerald-800/80 dark:text-white/70 font-bold uppercase tracking-wider mt-1 leading-none">Average rating</span>
              </div>
            </motion.div>

            {/* 2 Most Recent Listings Floating Stack/Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase">Newly Added</span>
              
              {decoratedListings.length === 0 ? (
                /* Empty state card */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-800/60 dark:bg-[#124b33]/20 dark:border-[#1e6344]/30 rounded-2xl p-6 text-center dark:text-white/50 text-xs font-semibold"
                >
                  Naye listings jald hi aayenge!
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {decoratedListings.slice(0, 2).map((l, index) => {
                    const priceFormatted = formatPrice(l.rent);
                    const listingImg = getListingImage(l);
                    return (
                      <motion.div
                        key={`hero-recent-${l.id || ''}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          y: [0, -8, 0] 
                        }}
                        transition={{
                          delay: 0.5 + index * 0.15,
                          y: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.75
                          },
                          opacity: { duration: 0.4 },
                          x: { duration: 0.4 }
                        }}
                        onClick={() => setSelectedDetailedListing(l)}
                        className="bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 transition-all outline-none border border-emerald-100 dark:border-white/10 rounded-2xl p-2.5 flex gap-3 cursor-pointer select-none shadow-sm dark:shadow-none"
                      >
                        {/* Little Photo Aspect */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                          <img 
                            src={listingImg} 
                            alt={l.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-emerald-600 border border-emerald-500/20 text-white rounded px-1.5 py-0.5 text-[8px] font-black tracking-wide uppercase">
                            {l.type === 'Sharing Flat' ? 'Flat' : l.type === 'Hostel' ? 'Hostel' : 'Room'}
                          </div>
                        </div>

                        {/* Text and Price values */}
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-black truncate max-w-[125px] text-emerald-950 dark:text-white/95">{l.title}</h4>
                            <div className="flex items-center gap-0.5 text-[#F59E0B] text-xs shrink-0">
                              <span>★</span>
                              <span className="font-bold">{l.rating || 4.5}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-emerald-800/70 dark:text-white/70 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#F59E0B] shrink-0" />
                            <span className="truncate">{l.area}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] mt-1 pr-1">
                            <span className="text-[10px] text-emerald-800/60 dark:text-white/60 font-medium">Monthly Rent</span>
                            <span className="font-extrabold text-[#F59E0B]">PKR {priceFormatted}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div id="room-listings-section" />

      {/* 12. Dismissible Auto-Rotating Awareness Alert */}
      {isBannerVisible && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-accent/10 border border-accent/25 p-4 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden"
        >
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1 flex-1 pr-6">
            <h3 className="font-extrabold text-accent text-xs leading-none uppercase tracking-wider">KamraFind Safety Tips</h3>
            <p className="text-gray-700 dark:text-slate-200 font-bold text-xs sm:text-sm animate-fade-in leading-snug">
              {lang === 'EN' ? tips[tipIndex].en : tips[tipIndex].ur}
            </p>
          </div>
          <button
            onClick={() => setIsBannerVisible(false)}
            className="absolute top-3 right-3 text-accent hover:text-orange-700 dark:hover:text-white p-1 rounded-full transition-colors"
            title="Khatam"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 5. Recently Viewed Strips */}
      {recentlyViewed.length > 0 && (
        <RecentlyViewed 
          listings={recentlyViewed} 
          onSelect={(l) => {
            trackRecentViewing(l);
            setSelectedDetailedListing(l);
          }} 
          lang={lang} 
        />
      )}

      {/* Search Filters Container */}
      {/* Desktop Filters are displayed inline. Mobile filters collapsed and triggered via floating panel */}
      <div className="hidden md:block bg-primary/5 dark:bg-slate-900/60 p-5 md:p-8 rounded-[2.5rem] border border-primary/10 dark:border-gray-800 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-xl text-gray-900 dark:text-white leading-none">{t.findRoom}</h2>
              <p className="text-[10px] text-primary dark:text-emerald-400 font-black tracking-widest uppercase mt-1 animate-pulse">{t.subTitle}</p>
            </div>
          </div>
          <button 
            onClick={clearFilters}
            className="text-xs font-extrabold text-primary dark:text-emerald-400 hover:bg-primary/10 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider"
          >
            {t.reset}
          </button>
        </div>
        
        {renderFiltersForm()}
      </div>

      {/* Mobile Floating Trigger FAB and Status Strip */}
      <div className="md:hidden flex items-center justify-between bg-primary/5 dark:bg-slate-900/40 p-4 rounded-3xl border border-primary/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Filters Collapsed</span>
        </div>
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg"
        >
          <Filter className="w-4 h-4" />
          Filters Config
        </button>
      </div>

      {/* Listings Header & Controls */}
      <div className="px-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-bold">
            Showing <span className="text-gray-900 dark:text-white font-black">{sortedListings.length}</span> {t.matchingRooms}
          </p>
          {showSavedOnly && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-red-500/10 border border-red-200 text-red-650 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> Saved Rooms / Pasandidah Kamray
            </span>
          )}
        </div>

        {/* Sort drop options & MAP view toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-start">
          {/* Sorting Control */}
          <div className="relative group w-1/2 sm:w-48 text-xs font-bold">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2.5 text-gray-700 dark:text-gray-200 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="priceAsc">{t.sortPriceLow}</option>
              <option value="priceDesc">{t.sortPriceHigh}</option>
              <option value="topRated">{t.sortRating}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 3. Map View / List View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-black">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-emerald-400 shadow' 
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === 'map' 
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-emerald-400 shadow' 
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Switch representation */}
      {viewMode === 'map' ? (
        <KarachiMap 
          listings={sortedListings} 
          selectedArea={filters.area} 
          onSelectArea={(area) => setFilters({ ...filters, area })} 
          lang={lang} 
          onViewDetails={(listing) => {
            trackRecentViewing(listing);
            setSelectedDetailedListing(listing);
          }}
        />
      ) : (
        /* Grid list */
        sortedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {sortedListings.map((listing, listingIdx) => (
              <ListingCard 
                key={`listing-grid-${listing.id || ''}-${listingIdx}`} 
                listing={listing} 
                onAskAi={() => onAskAi(listing)} 
                onContact={() => handleContact(listing)}
                onViewProfile={(id) => setViewingProfileId(id)}
                onTrackVisit={() => trackRecentViewing(listing)}
                matchScore={getMatchScore(listing)}
                isCompared={compareIds.includes(listing.id)}
                onToggleCompare={() => toggleCompare(listing.id)}
                lang={lang}
                filters={filters}
                onViewDetails={() => {
                  trackRecentViewing(listing);
                  setSelectedDetailedListing(listing);
                }}
                onDeleteListing={() => setDeletingListing(listing)}
                onReportListing={() => {
                  setReportingListing(listing);
                  setReportReason('Scam / Fake Listing');
                  setReportDetails('');
                  setReportSubmitted(false);
                }}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center space-y-4 border border-dashed border-gray-300 dark:border-gray-800 shadow-sm"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{t.noRooms}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {t.noRoomsSub}
              </p>
            </div>
            <button 
              onClick={clearFilters}
              className="text-primary dark:text-emerald-400 font-extrabold text-sm hover:underline"
            >
              {t.clearAllFilters}
            </button>
          </motion.div>
        )
      )}

      {/* 4. Compare sticky bot ribbon */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-lg mx-auto z-50">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">{compareIds.length}</span>
            <span className="text-xs font-bold text-slate-100">Rooms to Compare side-by-side</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCompareIds([])}
              className="text-[10px] text-gray-400 hover:text-white font-extrabold tracking-widest uppercase mr-2"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-primary hover:brightness-110 text-white rounded-xl px-4 py-2 text-xs font-black shadow-lg"
            >
              {t.compareNow}
            </button>
          </div>
        </div>
      )}

      {/* Comparisons Matrix Modal overlay */}
      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        listings={decoratedListings.filter(l => compareIds.includes(l.id))}
        onContact={(l) => handleContact(l)}
        lang={lang}
      />

      {/* 13. Mobile sliding Bottom Sheet (slideUp filters dialog) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden flex items-end">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] border-t dark:border-gray-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2 border-b dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-sm text-gray-950 dark:text-white uppercase tracking-wider">{t.moreFilters}</h3>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {renderFiltersForm()}

              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl text-center shadow-lg"
              >
                Apply Filters Configuration
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chats modal */}
      {activeChat && (
        <ChatModal 
          isOpen={!!activeChat} 
          onClose={() => setActiveChat(null)} 
          receiverId={activeChat.receiverId} 
          receiverName={activeChat.receiverName}
          listing={activeChat.listing}
          onViewProfile={(id) => setViewingProfileId(id)}
        />
      )}

      {/* Profile view */}
      {viewingProfileId && (
        <PublicProfileModal 
          isOpen={!!viewingProfileId} 
          onClose={() => setViewingProfileId(null)} 
          userId={viewingProfileId}
        />
      )}

      {/* Listing Detail Modal Popup */}
      {selectedDetailedListing && (
        <ListingDetailModal
          isOpen={!!selectedDetailedListing}
          onClose={() => setSelectedDetailedListing(null)}
          listing={selectedDetailedListing}
          onAskAi={(listing) => {
            onAskAi(listing);
            setSelectedDetailedListing(null);
          }}
          onContact={(listing) => {
            handleContact(listing);
          }}
          onViewProfile={(id) => {
            setViewingProfileId(id);
            setSelectedDetailedListing(null);
          }}
          lang={lang}
          matchScore={getMatchScore(selectedDetailedListing)}
          currentUserUid={user?.uid}
          onDelete={(listing) => setDeletingListing(listing)}
          onReport={(listing) => {
            setReportingListing(listing);
            setReportReason('Scam / Fake Listing');
            setReportDetails('');
            setReportSubmitted(false);
          }}
        />
      )}

      {/* 16. Custom Report Modal */}
      <AnimatePresence>
        {reportingListing && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportingListing(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 text-left z-10"
            >
              <button 
                onClick={() => setReportingListing(null)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!reportSubmitted ? (
                <form onSubmit={handleReportSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Report Listing</span>
                    <h3 className="text-xl font-black text-gray-950 dark:text-white leading-tight">
                      {lang === 'EN' ? 'Is there something wrong?' : 'Kya is listing mein masla hai?'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lang === 'EN' ? 'Help us keep Karachi rooms safe. Choose a reason below:' : 'Karachi ke kamron ko safe rakhne mein madad karen:'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { reason: 'Scam / Fake Listing', ur: 'Scam ya Jhooti Post' },
                      { reason: 'Inaccurate Price / Info', ur: 'Galat Rent ya Info' },
                      { reason: 'Already Rented / Unavailable', ur: 'Pehle se rent ho chuka hai' },
                      { reason: 'Inappropriate Contact Person', ur: 'Ghair ikhlaqi bartao' },
                      { reason: 'Other Issue', ur: 'Koi aur masla' }
                    ].map((item) => (
                      <label 
                        key={item.reason} 
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          reportReason === item.reason 
                            ? 'bg-primary/5 dark:bg-emerald-500/5 border-primary/25 dark:border-emerald-500/30' 
                            : 'bg-gray-50 dark:bg-slate-850/50 border-transparent hover:border-gray-200 dark:hover:border-slate-850'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report_reason"
                          value={item.reason}
                          checked={reportReason === item.reason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {lang === 'EN' ? item.reason : item.ur}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {lang === 'EN' ? 'Additional Details (Optional)' : 'mazeed tafseelat (Ikhteyari)'}
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder={lang === 'EN' ? "e.g., landlord is asking for Rs.5000 advance without showing the room." : "Misaal ke tor par: landlord bina kamra dikhaye advance maang raha hai."}
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-slate-850 border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all resize-none text-gray-800 dark:text-gray-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reportingSubmitting}
                    className="w-full py-3 px-4 bg-primary hover:bg-indigo-650 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {reportingSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{lang === 'EN' ? 'Submit Report' : 'Report Submit Karen'}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {lang === 'EN' ? 'Report Submitted!' : 'Report Chali Gayi!'}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                      {lang === 'EN' 
                        ? 'Thank you. Our safety system and administration team have received your report and are investigating.'
                        : 'Shukriya. Humara safety system aur staff is report ka jaiza lekar is listing ko jald verify karega.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setReportingListing(null)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold rounded-lg cursor-pointer transition-all text-gray-700 dark:text-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 17. Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingListing && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!deletingSubmitting) setDeletingListing(null); }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 text-center z-10"
            >
              {!deleteDone ? (
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {lang === 'EN' ? 'Confirm Deletion' : 'Khaatme ki tasdeeq'}
                    </h3>
                    <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed">
                      {lang === 'EN' 
                        ? 'Are you absolutely sure you want to delete this room listing? This action cannot be reverted.'
                        : 'Kya aap is room listing ko permanently khatam karna chahte hain? Dubara wapas nahi laya ja sakega.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      disabled={deletingSubmitting}
                      onClick={() => setDeletingListing(null)}
                      className="py-3 bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      {lang === 'EN' ? 'Cancel' : 'Radd Karen'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingSubmitting}
                      onClick={handleDeleteSubmit}
                      className="py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {deletingSubmitting ? (
                        <span>Deleting...</span>
                      ) : (
                        <span>{lang === 'EN' ? 'Delete Room' : 'Khatam Karen'}</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7" strokeWidth={3} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      {lang === 'EN' ? 'Listing Deleted' : 'Listing khatam ho gayi'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Successfully removed from KamraFind.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 1. Updated modern card design
interface DecoratedListingProps extends ListingCardProps {
  onTrackVisit: () => void;
  matchScore: number;
  isCompared: boolean;
  onToggleCompare: () => void;
  lang: 'EN' | 'UR';
  filters?: {
    type: string;
    area: string;
    university: string;
    budget: number;
    gender: string;
    meals: string;
  };
}

interface ListingCardProps {
  listing: Listing;
  onAskAi: () => void;
  onContact: () => void;
  onViewProfile: (id: string) => void;
  onViewDetails: () => void;
  onDeleteListing?: () => void;
  onReportListing?: () => void;
}

const ListingCard: React.FC<DecoratedListingProps> = ({ 
  listing, onAskAi, onContact, onViewProfile, onTrackVisit, matchScore, isCompared, onToggleCompare, lang, filters, onViewDetails,
  onDeleteListing, onReportListing
}) => {
  const [showNumber, setShowNumber] = useState(false);
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);
  const [user] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(() => {
    const saved = localStorage.getItem('kamraFind_savedRoomIds');
    if (saved) {
      try {
        const ids: string[] = JSON.parse(saved);
        return ids.includes(listing.id);
      } catch (e) { return false; }
    }
    return false;
  });

  const isOwner = user && user.uid === listing.ownerId;
  const isNew = listing.createdAt && (Date.now() - listing.createdAt < 24 * 60 * 60 * 1000);

  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Unsplash links representing stylish, realistic Pakistani shared hostels & rooms
  const mockImagesByHash = [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80", // bed study
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=80", // hostel room
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=500&q=80", // bedroom bed
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=500&q=80", // minimalist room
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80"  // family apartment
  ];
  const charSum = listing.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const displayImages = (listing.images && listing.images.length > 0)
    ? listing.images
    : [listing.imageUrl || mockImagesByHash[charSum % mockImagesByHash.length]];

  const roomImageUrl = displayImages[activeImgIndex] || displayImages[0];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = () => {
    onDeleteListing?.();
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    if (score >= 70) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    return "bg-slate-500/10 text-slate-650 dark:text-slate-400";
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={() => { onTrackVisit(); onViewDetails(); }}
      className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col h-full group relative cursor-pointer"
    >
      {/* 1. Image Area with dynamic tag markers */}
      <div className="h-48 relative overflow-hidden flex items-center justify-center text-gray-400 group/img">
        <img 
          src={roomImageUrl} 
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Abstract background shadow mask for tag reading visibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/70 to-transparent z-[1] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/75 to-transparent z-[1] pointer-events-none" />

        {/* Carousel Buttons overlay */}
        {displayImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-black/50 hover:bg-black/75 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Dots pagination */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/35 backdrop-blur-xs px-2 py-1 rounded-full">
              {displayImages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    idx === activeImgIndex ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Verified Landlord Sticker */}
        {listing.verified && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow">
            <Check className="w-3 h-3" strokeWidth={3} />
            <span>Verified</span>
          </div>
        )}

        {/* Save listing Heart Icon on top corner */}
        <motion.button
          onClick={toggleSave}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500 hover:bg-black/60 transition-all cursor-pointer"
          title="Save Room"
        >
          <Heart className={`w-4.5 h-4.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </motion.button>

        {/* Price Tag Overlay Badge (prominently shown on image) */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-3 py-1.5 bg-primary dark:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg">
            Rs. {formatPrice(listing.rent)}/m
          </span>
        </div>

        {/* Star Rating Badge */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-md text-white rounded-lg px-2 py-1 text-[10px] font-black leading-none">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{listing.rating || '4.2'}</span>
        </div>

        {/* View Details Hover Overlay */}
        <div className="absolute inset-0 bg-primary/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-[2] pointer-events-none">
          <button
            onClick={() => { onTrackVisit(); onAskAi(); }}
            className="px-5 py-2.5 bg-white dark:bg-slate-900 text-primary dark:text-emerald-400 font-extrabold text-xs rounded-xl shadow-2xl scale-95 group-hover:scale-100 transition-all pointer-events-auto cursor-pointer"
          >
            Ask AI Details ➔
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header Tags Strip */}
          <div className="flex flex-wrap gap-1.5 min-h-[22px]">
            {isNew && (
              <span className="px-2 py-0.5 bg-accent text-white rounded text-[9px] font-black uppercase">
                New
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
              listing.gender === 'Boys' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                : listing.gender === 'Girls' 
                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' 
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
            }`}>
              {listing.gender === 'Any' ? 'Family/Any' : `${listing.gender} Only`}
            </span>
            {listing.mealsIncluded && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded text-[9px] font-black uppercase flex items-center gap-0.5">
                <Utensils className="w-2.5 h-2.5" /> Meals Included
              </span>
            )}
          </div>

          <div>
            <h3 className="font-extrabold text-base leading-tight mb-1 text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
              {listing.title}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 text-xs mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{listing.area} · Near {listing.university}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Match Percentage score representation with interactive animated popover */}
            <div 
              className="relative inline-block cursor-pointer select-none z-10"
              onMouseEnter={() => setShowMatchBreakdown(true)}
              onMouseLeave={() => setShowMatchBreakdown(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowMatchBreakdown(!showMatchBreakdown);
              }}
            >
              <motion.span 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 grow-0 cursor-pointer ${getMatchScoreColor(matchScore)}`}
              >
                🧬 {matchScore}% Match
              </motion.span>

              {/* Animated Floating Match Details Breakdown */}
              <AnimatePresence>
                {showMatchBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 12 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                    className="absolute bottom-full left-0 mb-3 w-72 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-2xl z-50 text-gray-950 dark:text-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {lang === 'EN' ? 'Compatibility Analyzer' : 'Compatibility Jaiza'}
                        </span>
                        <span className="text-xs font-black text-primary dark:text-teal-400">
                          {matchScore}% Match
                        </span>
                      </div>
                      
                      {/* Dynamic Circular dash-array progress loop */}
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0 flex items-center justify-center">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-slate-850" fill="transparent" />
                            <motion.circle 
                              cx="24" 
                              cy="24" 
                              r="20" 
                              stroke={matchScore >= 85 ? '#10b981' : matchScore >= 70 ? '#f5a623' : '#64748b'} 
                              strokeWidth="3.2" 
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              initial={{ strokeDashoffset: `${2 * Math.PI * 20}` }}
                              animate={{ strokeDashoffset: `${2 * Math.PI * 20 * (1 - matchScore / 100)}` }}
                              transition={{ duration: 0.85, ease: 'easeOut' }}
                              fill="transparent" 
                            />
                          </svg>
                          <span className="absolute text-[9px] font-black">{matchScore}%</span>
                        </div>
                        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-normal">
                          {matchScore >= 85 
                            ? (lang === 'EN' ? "Highly recommended match for your academic preferences!" : "Aapki preferences ke liye bilkul behtareen aur highly compatible!")
                            : matchScore >= 70 
                            ? (lang === 'EN' ? "Decent, balanced budget fit near academic centers." : "Acha budget matching option jo ke safe area mein hai.")
                            : (lang === 'EN' ? "Adjust your filters to discover matching rooms nearby." : "Koshish karen filters ko adjust karke exact partner dhondhein.")}
                        </p>
                      </div>

                      {/* Staggered progress breakdown meters */}
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                        {[
                          {
                            title: lang === 'EN' ? 'Type Match' : 'Kamray Ki Kisaam',
                            val: listing.type,
                            match: !filters || filters.type === 'Any' || listing.type === filters.type
                          },
                          {
                            title: lang === 'EN' ? 'Locality / Area' : 'Area / Jagah',
                            val: listing.area,
                            match: !filters || filters.area === 'Any' || listing.area === filters.area
                          },
                          {
                            title: lang === 'EN' ? 'Uni Proximity' : 'University Qurbat',
                            val: listing.university,
                            match: !filters || filters.university === 'Any' || listing.university === filters.university
                          },
                          {
                            title: lang === 'EN' ? 'Gender Standard' : 'Gender Ki Shart',
                            val: listing.gender === 'Any' ? 'Family/Any' : listing.gender,
                            match: !filters || filters.gender === 'Any' || listing.gender === filters.gender
                          },
                          {
                            title: lang === 'EN' ? 'Rent vs Budget' : 'Kiraya Budget Limit',
                            val: `Rs. ${formatPrice(listing.rent)}`,
                            match: !filters || listing.rent <= filters.budget
                          }
                        ].map((b, bIdx) => (
                          <div key={bIdx} className="text-[10.5px] flex items-center justify-between gap-1.5">
                            <span className="text-gray-500 dark:text-gray-450 truncate max-w-[120px]">{b.title}</span>
                            <div className="flex items-center gap-1 overflow-hidden">
                              <span className={`text-[10px] font-semibold truncate max-w-[90px] ${b.match ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-550'}`}>
                                {b.val}
                              </span>
                              {b.match ? (
                                <span className="text-emerald-500 font-extrabold" title="Verified Match">✓</span>
                              ) : (
                                <span className="text-amber-500 font-extrabold" title="Filter mismatch">⚠</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {listing.furnished && (
              <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-lg text-[9px] font-bold uppercase">
                Furnished
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`compare-${listing.id}`}
                checked={isCompared}
                onChange={onToggleCompare}
                className="w-4.5 h-4.5 cursor-pointer accent-primary"
              />
              <label htmlFor={`compare-${listing.id}`} className="text-[10px] font-black text-gray-450 dark:text-slate-400 cursor-pointer uppercase tracking-wider">
                Compare Room
              </label>
            </div>
            
            <button 
              onClick={() => onViewProfile(listing.ownerId)}
              className="flex items-center gap-2 text-right group/profile"
            >
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover/profile:text-primary transition-colors">Owner</p>
                <p className="text-xs font-bold text-gray-700 dark:text-slate-200 underline decoration-primary/20 leading-tight">{listing.contactName}</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover/profile:bg-primary/10 group-hover/profile:text-primary transition-all">
                <User className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Action Button Strip */}
          <div className="grid grid-cols-2 gap-3.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onContact(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-primary/10 text-primary hover:border-primary/25 dark:text-emerald-400 font-extrabold text-xs hover:bg-primary/5 dark:hover:bg-emerald-500/5 transition-all w-full cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'EN' ? 'Contact' : 'Rabta Karen'}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAskAi(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-white font-extrabold text-xs hover:brightness-105 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Matcher</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onReportListing?.(); }}
              className="text-[9px] text-gray-400 hover:text-red-500 transition-colors uppercase font-black tracking-widest flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3 h-3" /> Report
            </button>

            {isOwner && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-[9px] text-red-400 hover:text-red-650 transition-colors uppercase font-black tracking-widest flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

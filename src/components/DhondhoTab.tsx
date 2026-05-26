import React, { useState } from 'react';
import { Search, MapPin, School, Banknote, Users, Utensils, Info, Phone, MessageCircle, Trash2, ShieldCheck, User } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Listing, AccommodationType, GenderPreference } from '../types';
import { KARACHI_AREAS, UNIVERSITIES } from '../constants';
import { motion } from 'motion/react';
import ChatModal from './ChatModal';
import PublicProfileModal from './PublicProfileModal';

interface DhondhoTabProps {
  listings: Listing[];
  onAskAi: (listing: Listing) => void;
  onLoginClick: () => void;
  user: any;
}

export default function DhondhoTab({ listings, onAskAi, onLoginClick, user }: DhondhoTabProps) {
  const [filters, setFilters] = useState({
    type: 'Any' as AccommodationType,
    area: 'Any',
    university: 'Any',
    budget: 50000,
    gender: 'Any' as GenderPreference,
    meals: 'Any',
  });

  const [activeChat, setActiveChat] = useState<{receiverId: string, receiverName: string, listing: Listing} | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const filteredListings = listings.filter((l) => {
    return (
      (filters.type === 'Any' || l.type === filters.type) &&
      (filters.area === 'Any' || l.area === filters.area) &&
      (filters.university === 'Any' || l.university === filters.university) &&
      (l.rent <= filters.budget) &&
      (filters.gender === 'Any' || l.gender === filters.gender) &&
      (filters.meals === 'Any' || (filters.meals === 'Yes' ? l.mealsIncluded : !l.mealsIncluded))
    );
  });

  const handleContact = (listing: Listing) => {
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

  return (
    <div className="space-y-6">
      {/* Awareness Alert */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent/10 border border-accent/20 p-4 rounded-2xl flex items-start gap-4"
      >
        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-accent" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-accent text-sm leading-tight uppercase tracking-wider">Awareness !!</h3>
          <p className="text-secondary font-semibold text-sm">
            Advance dene se pehle ghar zaroor dekho! Ask about hidden charges: <span className="underline decoration-accent/30">Gas, Pani, Security</span>.
          </p>
        </div>
      </motion.div>

      {/* Search Filters */}
      <div className="bg-primary/5 p-5 md:p-8 rounded-[2.5rem] border border-primary/10 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900 leading-tight">Kamara Dhondho</h2>
              <p className="text-[10px] text-primary font-black tracking-widest uppercase mt-0.5 animate-pulse">Dhoondo apna perfect roommate</p>
            </div>
          </div>
          <button 
            onClick={() => setFilters({ type: 'Any', area: 'Any', university: 'Any', budget: 50000, gender: 'Any', meals: 'Any' })}
            className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-xl transition-all uppercase tracking-wider"
          >
            Reset
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Accommodation Type</label>
            <div className="relative group">
              <select 
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                className="w-full bg-white border-2 border-primary/5 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary/10 border-transparent outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
              >
                <option value="Any">All Types</option>
                <option value="Hostel">Hostel</option>
                <option value="Sharing Flat">Sharing Flat</option>
                <option value="Single Room">Single Room</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Area Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Locality / Area</label>
            <div className="relative group">
              <select 
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                className="w-full bg-white border-2 border-primary/5 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary/10 border-transparent outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
              >
                <option value="Any">All of Karachi</option>
                {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* University Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Near University</label>
            <div className="relative group">
              <select 
                value={filters.university}
                onChange={(e) => setFilters({ ...filters, university: e.target.value })}
                className="w-full bg-white border-2 border-primary/5 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary/10 border-transparent outline-none appearance-none shadow-sm transition-all cursor-pointer group-hover:border-primary/20"
              >
                <option value="Any">Any University</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
                <School className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Budget Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Monthy Budget</label>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">Rs. {filters.budget.toLocaleString()}</span>
            </div>
            <div className="px-1 pt-2">
              <input 
                type="range" 
                min="2000" 
                max="100000" 
                step="1000"
                value={filters.budget}
                onChange={(e) => setFilters({ ...filters, budget: parseInt(e.target.value) })}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
                <span>2k</span>
                <span>50k</span>
                <span>100k</span>
              </div>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Gender Preference</label>
            <div className="flex bg-white/50 p-1.5 rounded-2xl border-2 border-primary/5 shadow-inner">
              {(['Any', 'Boys', 'Girls'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setFilters({ ...filters, gender: g })}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                    filters.gender === g 
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105 z-10' 
                      : 'text-primary/60 hover:text-primary hover:bg-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Meals Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Meals Included</label>
            <div className="flex bg-white/50 p-1.5 rounded-2xl border-2 border-primary/5 shadow-inner">
              {(['Any', 'Yes', 'No'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilters({ ...filters, meals: m })}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                    filters.meals === m 
                      ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-105 z-10' 
                      : 'text-accent/60 hover:text-accent hover:bg-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Count */}
      <div className="px-1 flex justify-between items-center">
        <p className="text-sm text-gray-500 font-medium">
          Showing {filteredListings.length} matching rooms
        </p>
      </div>

      {/* Listing Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {filteredListings.map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onAskAi={() => onAskAi(listing)} 
              onContact={() => handleContact(listing)}
              onViewProfile={(id) => setViewingProfileId(id)}
            />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-12 text-center space-y-4 border border-dashed border-gray-300"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Koi kamra nahi mila</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Please change your filters or try asking our AI Assistant for recommendations.
            </p>
          </div>
          <button 
            onClick={() => setFilters({ type: 'Any', area: 'Any', university: 'Any', budget: 50000, gender: 'Any', meals: 'Any' })}
            className="text-primary font-semibold text-sm hover:underline"
          >
            Clear all filters
          </button>
        </motion.div>
      )}

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

      {viewingProfileId && (
        <PublicProfileModal 
          isOpen={!!viewingProfileId} 
          onClose={() => setViewingProfileId(null)} 
          userId={viewingProfileId}
        />
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: Listing;
  onAskAi: () => void;
  onContact: () => void;
  onViewProfile: (id: string) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onAskAi, onContact, onViewProfile }) => {
  const [showNumber, setShowNumber] = useState(false);
  const [user] = useAuthState(auth);

  const isOwner = user && user.uid === listing.ownerId;
  const isNew = listing.createdAt && (Date.now() - listing.createdAt < 24 * 60 * 60 * 1000);

  const handleDelete = async () => {
    if (window.confirm("Aap ye listing khatam karna chahte hain?")) {
      try {
        await deleteDoc(doc(db, 'listings', listing.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `listings/${listing.id}`);
      }
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full group"
    >
      {/* Image Placeholder */}
      <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center text-gray-400 transition-colors group-hover:bg-gray-200">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest">{listing.type}</span>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isNew && (
            <span className="px-2 py-1 bg-accent text-white rounded-md text-[10px] font-bold uppercase animate-pulse">
              New
            </span>
          )}
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
            listing.gender === 'Boys' ? 'bg-blue-100 text-blue-700' : 
            listing.gender === 'Girls' ? 'bg-pink-100 text-pink-700' : 
            'bg-purple-100 text-purple-700'
          }`}>
            {listing.gender === 'Any' ? 'Family/Any' : `${listing.gender} Only`}
          </span>
          {listing.mealsIncluded && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Meals Included
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{listing.title}</h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{listing.area} · Near {listing.university}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">Rs. {listing.rent.toLocaleString()}</span>
            <span className="text-gray-400 text-xs font-medium ml-1">/ month</span>
          </div>
          <button 
            onClick={() => onViewProfile(listing.ownerId)}
            className="flex items-center gap-2 group/profile text-right"
          >
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover/profile:text-primary transition-colors">Owner</p>
              <p className="text-xs font-bold text-gray-700 underline decoration-primary/20">{listing.contactName}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover/profile:bg-primary/10 group-hover/profile:text-primary transition-all">
              <User className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button 
            onClick={onContact}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-primary/10 text-primary font-bold text-sm hover:bg-primary/5 transition-all w-full"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Rabta Karain</span>
          </button>
          <button 
            onClick={onAskAi}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-105 shadow-sm transition-all"
          >
            <Search className="w-4 h-4" />
            <span>AI Assist</span>
          </button>
        </div>

        <div className="mt-4 flex justify-between items-center">
          {/* Report Button */}
          <button className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase font-bold tracking-widest flex items-center gap-1">
            <Info className="w-3 h-3" /> Report Listing
          </button>

          {isOwner && (
            <button 
              onClick={handleDelete}
              className="text-[10px] text-red-400 hover:text-red-600 transition-colors uppercase font-bold tracking-widest flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Listing
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

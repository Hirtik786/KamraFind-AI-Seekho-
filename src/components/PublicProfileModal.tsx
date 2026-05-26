import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { X, User, ShieldCheck, Mail, Phone, Calendar, MapPin, Layers } from 'lucide-react';
import { Listing } from '../types';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  photoURL?: string;
  emailVerified: boolean;
}

export default function PublicProfileModal({ isOpen, onClose, userId }: PublicProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }

        const q = query(collection(db, 'listings'), where('ownerId', '==', userId));
        const snap = await getDocs(q);
        setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      } catch (err) {
        console.error("Public profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-black/5 rounded-full z-10 transition-colors">
          <X className="w-6 h-6 text-gray-500" />
        </button>

        {loading ? (
          <div className="p-20 flex justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : profile ? (
          <div className="overflow-y-auto">
            {/* Header */}
            <div className="bg-primary/5 p-10 flex flex-col items-center text-center border-b border-primary/5">
               <div className="relative mb-6">
                 <img 
                    src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`} 
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
                    alt="" 
                 />
                 {profile.emailVerified && (
                   <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-primary">
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                 )}
               </div>
               <h3 className="text-3xl font-black text-gray-900 tracking-tight">{profile.displayName}</h3>
               <div className="flex items-center gap-2 mt-2">
                 <p className="text-gray-500 font-bold flex items-center gap-2"><Mail className="w-4 h-4" /> {profile.email}</p>
               </div>
               {profile.bio && (
                 <p className="mt-6 text-gray-600 font-medium max-w-md italic">"{profile.bio}"</p>
               )}
            </div>

            {/* Stats & Listings */}
            <div className="p-8 space-y-10">
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listings</p>
                    <p className="text-lg font-black text-gray-900">{listings.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{profile.phone || 'Private'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member Since</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">May 2024</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <h4 className="text-xl font-black text-gray-900 flex items-center gap-3">
                   <Layers className="w-6 h-6 text-primary" /> Active Listings
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listings.map(l => (
                      <div key={l.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary/20 transition-all group">
                         <h5 className="font-bold text-gray-900 line-clamp-1">{l.title}</h5>
                         <p className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                           <MapPin className="w-3 h-3" /> {l.area}
                         </p>
                         <p className="text-sm font-black text-primary mt-3">Rs. {l.rent.toLocaleString()}</p>
                      </div>
                    ))}
                    {listings.length === 0 && (
                      <p className="col-span-2 text-center p-10 bg-gray-50 rounded-2xl text-gray-400 font-bold">Koi listing nahi mili.</p>
                    )}
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-gray-400 font-bold">Profile not found.</div>
        )}
      </motion.div>
    </div>
  );
}

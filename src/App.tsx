/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, PlusCircle, MessageSquare, ShieldCheck, User, LogOut, LogIn, Mail } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, orderBy, setDoc, doc, addDoc } from 'firebase/firestore';
import { auth, logout, db, handleFirestoreError, OperationType } from './firebase';
import { Listing } from './types';
import { SAMPLE_LISTINGS } from './constants';
import DhondhoTab from './components/DhondhoTab';
import PostListingTab from './components/PostListingTab';
import AIAssistantTab from './components/AIAssistantTab';
import ProfileTab from './components/ProfileTab';
import MessagesTab from './components/MessagesTab';
import ContactTab from './components/ContactTab';
import LoginModal from './components/LoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dhondho' | 'post' | 'messages' | 'profile' | 'ai' | 'contact'>('dhondho');
  const [listings, setListings] = useState<Listing[]>([]);
  const [aiContextListing, setAiContextListing] = useState<Listing | null>(null);

  const [user, loading, error] = useAuthState(auth);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  // Sync user profile to Firestore
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email?.split('@')[0] || 'User'}&background=random`,
        lastLogin: Date.now(),
        emailVerified: user.emailVerified
      }, { merge: true }).catch(err => {
        console.error("User sync error:", err);
      });
    }
  }, [user]);

  // Sync listings from Firestore
  useEffect(() => {
    // We remove orderBy from query to ensure documents missing createdAt (legacy) still show up
    const q = query(collection(db, 'listings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedListings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Listing));
      
      // Sort manually in memory
      fetchedListings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      const combined = [...fetchedListings, ...SAMPLE_LISTINGS.filter(s => !fetchedListings.find(f => f.id === s.id))];
      setListings(combined);
    }, (err) => {
      setToast({ message: "Listings load karne mein masla hua. Please refresh karein.", type: 'error' });
    });

    return () => unsubscribe();
  }, []);

  const addListing = async (newListing: Listing) => {
    if (!user) {
      setToast({ message: "Please login to post a listing!", type: 'error' });
      setIsLoginModalOpen(true);
      return;
    }

    if (!user.emailVerified) {
      setToast({ message: "Peila apni email verify karein! Check your inbox.", type: 'error' });
      return;
    }
    
    try {
      const newDocRef = doc(collection(db, 'listings'));
      const listingData = {
        ...newListing,
        id: newDocRef.id,
        ownerId: user.uid,
        createdAt: Date.now()
      };
      
      // Basic validation
      if (!listingData.title || !listingData.rent || isNaN(listingData.rent)) {
        throw new Error("Title and Rent are required!");
      }

      await setDoc(newDocRef, listingData);
      setToast({ message: "Listing kamyabi se add ho gayi!", type: 'success' });
    } catch (err) {
      console.error("Add listing error:", err);
      setToast({ message: "Listing add nahi ho saki. Please check fields.", type: 'error' });
    }
  };

  const saveApiKey = (key: string) => {
    // Deprecated
  };

  const openAiWithListing = (listing: Listing) => {
    setAiContextListing(listing);
    setActiveTab('ai');
  };

  const tabs = [
    { id: 'dhondho', label: 'Dhondho', icon: Search },
    { id: 'post', label: 'Listing Daalo', icon: PlusCircle },
    { id: 'messages', label: 'Inbox', icon: MessageSquare },
    { id: 'profile', label: 'Mera Account', icon: User },
    { id: 'contact', label: 'Rabta', icon: Mail },
    { id: 'ai', label: 'AI Assistant', icon: Search },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-gray-900 pb-20 md:pb-0 md:pt-16 font-sans">
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Search className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary tracking-tight leading-none">KamraFind</h1>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/50 mt-1">Dhoondo apna perfect roommate</span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 p-1.5 pr-4 rounded-full transition-all ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
              >
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email?.split('@')[0] || 'User'}&background=random`} 
                  alt="" 
                  className="w-8 h-8 rounded-full border border-primary/20" 
                />
                <span className="text-sm font-bold truncate max-w-[100px]">
                  {(user.displayName || user.email?.split('@')[0] || 'User').split(' ')[0]}
                </span>
                {!user.emailVerified && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" title="Email not verified" />
                )}
              </button>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" /> Account
            </button>
          )}
        </nav>
      </header>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-40">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary leading-none">KamraFind</h1>
          <span className="text-[7px] font-black uppercase tracking-[0.1em] text-primary/50 mt-0.5">Dhoondo apna perfect roommate</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email?.split('@')[0] || 'User'}&background=random`} 
                onClick={() => setActiveTab('profile')} 
                alt="" 
                className={`w-8 h-8 rounded-full border-2 ${activeTab === 'profile' ? 'border-primary' : 'border-transparent'}`} 
              />
              {!user.emailVerified && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="p-2 text-primary disabled:opacity-50"
            >
              <User className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dhondho' && (
            <motion.div
              key="dhondho"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DhondhoTab listings={listings} onAskAi={openAiWithListing} user={user} onLoginClick={handleLogin} />
            </motion.div>
          )}
          {activeTab === 'post' && (
            <motion.div
              key="post"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PostListingTab onAdd={addListing} onSuccess={() => setActiveTab('dhondho')} onLoginClick={handleLogin} />
            </motion.div>
          )}
          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MessagesTab />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileTab listings={listings} />
            </motion.div>
          )}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ContactTab />
            </motion.div>
          )}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]"
            >
              <AIAssistantTab 
                listings={listings} 
                contextListing={aiContextListing}
                onClearContext={() => setAiContextListing(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-primary/10' : ''}`} />
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-20 left-4 right-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[60] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-sm mx-auto ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onToast={(msg, type) => setToast({ message: msg, type })}
      />
    </div>
  );
}

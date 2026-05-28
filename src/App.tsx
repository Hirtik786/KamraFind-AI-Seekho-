/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, PlusCircle, MessageSquare, ShieldCheck, User, LogOut, LogIn, Mail, Sparkles, X, Sun, Moon, Bell } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, orderBy, setDoc, doc, addDoc, where, deleteDoc } from 'firebase/firestore';
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
import FloatingChatPanel from './components/FloatingChatPanel';
import PublicProfileModal from './components/PublicProfileModal';
import CustomCursor from './components/CustomCursor';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? 'dark' : 'light';
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState<'dhondho' | 'post' | 'messages' | 'profile' | 'ai' | 'contact'>('dhondho');
  const [listings, setListings] = useState<Listing[]>([]);
  const [aiContextListing, setAiContextListing] = useState<Listing | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 9. Notification Bell & 10. Language Toggle States
  const [lang, setLang] = useState<'EN' | 'UR'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kamraFind_lang');
      return (saved === 'UR' ? 'UR' : 'EN');
    }
    return 'EN';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Format notification relative time helper
  const formatNotifyTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    let ms = 0;
    if (typeof createdAt === 'number') {
      ms = createdAt;
    } else if (createdAt?.seconds) {
      ms = createdAt.seconds * 1000;
    } else {
      return 'Just now';
    }
    const diff = Date.now() - ms;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Real-time Firestore notification subscription
  useEffect(() => {
    if (!user) {
      setNotifications([
        {
          id: 'system_welcome',
          titleEn: 'Welcome to KamraFind!',
          textEn: 'Please register or Sign In to receive real-time roommate matched alerts and chat updates immediately.',
          titleUr: 'KamraFind mein Khushamdeed!',
          textUr: 'Roommate matches aur chat alerts hasil karne ke liye apna account sign-in/register karein.',
          read: false,
          createdAt: Date.now()
        }
      ]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sort manually by timestamp
      list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

      if (snapshot.empty && list.length === 0) {
        // Seed a dynamic welcome notification in Firestore so they start off with active DB row
        const welcomeDoc = doc(collection(db, 'notifications'));
        setDoc(welcomeDoc, {
          id: welcomeDoc.id,
          userId: user.uid,
          titleEn: 'Your Inbox is Ready!',
          textEn: 'Welcome to KamraFind! You will receive real-time updates and roommate suggestions here.',
          titleUr: 'Aapka Alert Inbox Tayyar hai!',
          textUr: 'KamraFind par khushamdeed! Aapko yahan chats aur matches ke alerts milenge.',
          read: false,
          createdAt: Date.now(),
          type: 'system'
        });
        return;
      }

      setNotifications(list);
    }, (err) => {
      console.error("Notifications real-time error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleLanguage = () => {
    const next = lang === 'EN' ? 'UR' : 'EN';
    setLang(next);
    localStorage.setItem('kamraFind_lang', next);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomingConvs = snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        return data.lastSenderId !== user.uid;
      });
      setUnreadCount(incomingConvs.length);
    }, (err) => {
      console.error("Unread count listener error:", err);
    });
    return () => unsubscribe();
  }, [user]);

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
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let fetchedListings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Listing));
      
      // Seed if Firestore has 0 documents to avoid a blank initialization state
      if (snapshot.empty && fetchedListings.length === 0) {
        console.log("Seeding base listings to Firestore database...");
        for (const sample of SAMPLE_LISTINGS) {
          try {
            await setDoc(doc(db, 'listings', sample.id), {
              ...sample,
              createdAt: Date.now() - Math.floor(Math.random() * 10000000)
            });
          } catch (e) {
            console.error("Firestore seeding error:", e);
          }
        }
        return;
      }
      
      // Sort manually in memory
      fetchedListings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setListings(fetchedListings);
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

  const openAiWithListing = (listing: Listing) => {
    setAiContextListing(listing);
    setIsAiOpen(true);
  };

  const tabs = [
    { id: 'dhondho', label: lang === 'UR' ? 'Kamra Dhondho' : 'Find Room', icon: Search },
    { id: 'post', label: lang === 'UR' ? 'Listing Daalo' : 'Post Listing', icon: PlusCircle },
    { id: 'messages', label: lang === 'UR' ? 'Inbox' : 'Inbox', icon: MessageSquare },
    { id: 'profile', label: lang === 'UR' ? 'Mera Account' : 'Account', icon: User },
    { id: 'contact', label: lang === 'UR' ? 'Rabta Support' : 'Contact', icon: Mail },
  ];

  const handleNotificationClick = async (id: string) => {
    if (!id.startsWith('system_')) {
      try {
        await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
      } catch (err) {
        console.error("Error setting notification read status:", err);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      if (!n.id.startsWith('system_')) {
        try {
          await setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true });
        } catch (err) {
          console.error("Error marking read:", err);
        }
      }
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id.startsWith('system_')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-gray-900 pb-20 md:pb-0 md:pt-16 font-sans">
      <CustomCursor />
      {/* 11. Sticky navbar on scroll with subtle shadow */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 items-center px-6 justify-between shadow-sm transition-all duration-300">
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
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-2" />

          {/* 10. Language Toggle Button: "English | Roman Urdu" */}
          <motion.button
            onClick={toggleLanguage}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 rounded-xl text-xs font-black border border-gray-200 text-primary hover:bg-primary/5 transition-all cursor-pointer mr-1 uppercase"
            title="Switch Language"
          >
            {lang === 'EN' ? 'Roman Urdu' : 'English'}
          </motion.button>

          {/* 9. Notification Bell Icon with Badge Count next to Inbox */}
          <div className="relative inline-block text-left mr-1">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative flex items-center justify-center border border-gray-100"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-650"></span>
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-[60] space-y-3"
                >
                  <div className="flex justify-between items-center text-gray-900 dark:text-white">
                    <span className="text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">{lang === 'EN' ? 'Alarms & Activity' : 'Sargarmai & Itlayat'}</span>
                    {unreadNotificationsCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-primary dark:text-teal-450 hover:underline font-bold"
                      >
                        {lang === 'EN' ? 'Mark all read' : 'Sab ko parhein'}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {lang === 'EN' ? 'No recent notifications' : 'Koi nayi ittela nahi hai'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n.id)}
                          className={`relative py-3.5 flex flex-col gap-1 transition-all rounded-xl cursor-pointer group px-2.5 mb-1 ${!n.read ? 'bg-primary/5 border-l-2 border-primary font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                          style={{ background: !n.read ? (theme === 'dark' ? 'rgba(26,107,58,0.15)' : 'rgba(26,107,58,0.05)') : '' }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${!n.read ? 'text-primary dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                              {lang === 'EN' ? n.titleEn : n.titleUr}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] text-gray-400 dark:text-gray-500">{formatNotifyTime(n.createdAt)}</span>
                              <button
                                onClick={(e) => deleteNotification(n.id, e)}
                                className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 p-0.5 rounded transition-all ml-1"
                                title={lang === 'EN' ? 'Dismiss alert' : 'Sargarmai mitaein'}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                            {lang === 'EN' ? n.textEn : n.textUr}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Switcher Button */}
          <motion.button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative flex items-center justify-center border border-gray-100 dark:border-gray-800 mr-1"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'light' ? 0 : 360 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex items-center justify-center"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-gray-650 dark:text-gray-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </motion.div>
          </motion.button>
          
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
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 text-gray-900 dark:text-white">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary leading-none">KamraFind</h1>
          <span className="text-[7px] font-black uppercase tracking-[0.1em] text-primary/50 dark:text-teal-400 mt-0.5">Dhoondo apna perfect roommate</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Language selector */}
          <motion.button
            onClick={toggleLanguage}
            whileTap={{ scale: 0.95 }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-gray-200 dark:border-slate-700 text-primary dark:text-teal-400 hover:bg-primary/5 dark:hover:bg-teal-450/10 transition-all cursor-pointer mr-0.5 uppercase"
            title="Switch Language"
          >
            {lang === 'EN' ? 'Urdu' : 'Eng'}
          </motion.button>

          {/* Mobile Notification Bell */}
          <div className="relative inline-block text-left mr-0.5">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative flex items-center justify-center border border-gray-100 dark:border-slate-700"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute right-[-40px] mt-3 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-[60] space-y-3"
                >
                  <div className="flex justify-between items-center text-gray-900 dark:text-white">
                    <span className="text-[10px] sm:text-xs font-black text-gray-950 dark:text-gray-100 uppercase tracking-widest">{lang === 'EN' ? 'Alarms & Activity' : 'Sargarmai & Itlayat'}</span>
                    {unreadNotificationsCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-primary dark:text-teal-450 hover:underline font-bold"
                      >
                        {lang === 'EN' ? 'Mark all' : 'Sab ko'}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {lang === 'EN' ? 'No recent notifications' : 'Koi nayi ittela nahi hai'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n.id)}
                          className={`relative py-3.5 flex flex-col gap-1 transition-all rounded-xl cursor-pointer group px-2.5 mb-0.5 ${!n.read ? 'bg-primary/5 border-l-2 border-primary font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                          style={{ background: !n.read ? (theme === 'dark' ? 'rgba(26,107,58,0.15)' : 'rgba(26,107,58,0.05)') : '' }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">
                              {lang === 'EN' ? n.titleEn : n.titleUr}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] text-gray-400 dark:text-gray-500">{formatNotifyTime(n.createdAt)}</span>
                              <button
                                onClick={(e) => deleteNotification(n.id, e)}
                                className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 p-0.5 rounded transition-all ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                            {lang === 'EN' ? n.textEn : n.textUr}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Theme Switcher Button */}
          <motion.button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-50 dark:hover:bg-slate-850 transition-all cursor-pointer relative flex items-center justify-center border border-gray-100 dark:border-slate-800"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'light' ? 0 : 360 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex items-center justify-center"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-gray-640 dark:text-gray-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </motion.div>
          </motion.button>

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
              className="p-2 text-primary dark:text-teal-400 disabled:opacity-50"
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
              <DhondhoTab listings={listings} onAskAi={openAiWithListing} user={user} onLoginClick={handleLogin} lang={lang} />
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
              <PostListingTab onAdd={addListing} onSuccess={() => setActiveTab('dhondho')} onLoginClick={handleLogin} lang={lang} />
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
              <ProfileTab listings={listings} lang={lang} />
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
              <ContactTab lang={lang} />
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
                lang={lang}
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

      {/* Floating AI Assistant & Chat Panels */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 right-4 left-4 md:left-auto md:bottom-28 md:right-6 w-auto md:w-[400px] h-[70vh] md:h-[600px] z-[51] flex flex-col shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 bg-white"
          >
            <AIAssistantTab 
              listings={listings} 
              contextListing={aiContextListing}
              onClearContext={() => setAiContextListing(null)}
              onClose={() => setIsAiOpen(false)}
              lang={lang}
            />
          </motion.div>
        )}

        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 right-4 left-4 md:left-auto md:bottom-28 md:right-6 w-auto md:w-[400px] h-[70vh] md:h-[600px] z-[51] flex flex-col shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 bg-white"
          >
            <FloatingChatPanel 
              onClose={() => setIsChatOpen(false)}
              onViewProfile={(profileId) => setViewingProfileId(profileId)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons (FABs Stacked) */}
      {/* Floating Chat Button (Stacked Higher) */}
      <div className="fixed bottom-36 md:bottom-24 right-6 z-[52]">
        <motion.button
          onClick={() => { setIsChatOpen(!isChatOpen); setIsAiOpen(false); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
            isChatOpen 
              ? 'bg-gray-950 text-white hover:bg-black font-medium' 
              : 'bg-primary text-white hover:brightness-110'
          }`}
          title="Mera Chat Inbox"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
          {/* Notification Alert count badge */}
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-[10px] font-black justify-center items-center text-white">
                {unreadCount}
              </span>
            </span>
          )}
        </motion.button>
      </div>

      {/* Floating AI Action Button (Bottom-most) */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-[52]">
        <motion.button
          onClick={() => { setIsAiOpen(!isAiOpen); setIsChatOpen(false); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
            isAiOpen 
              ? 'bg-gray-950 text-white hover:bg-black font-medium' 
              : 'bg-primary text-white hover:brightness-110'
          }`}
          title="KamraFind AI Assistant"
        >
          {isAiOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
          {/* Pulsing Notification Dot/Ring */}
          {!isAiOpen && aiContextListing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accent text-[9px] font-black justify-center items-center text-white scale-90">1</span>
            </span>
          )}
          {/* Ping Ring for aesthetic cue */}
          {!isAiOpen && !aiContextListing && (
            <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping opacity-75 pointer-events-none" />
          )}
        </motion.button>
      </div>

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

      {viewingProfileId && (
        <PublicProfileModal 
          isOpen={!!viewingProfileId} 
          onClose={() => setViewingProfileId(null)}
          userId={viewingProfileId}
        />
      )}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onToast={(msg, type) => setToast({ message: msg, type })}
      />
    </div>
  );
}

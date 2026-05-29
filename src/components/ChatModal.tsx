import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { X, Send, MessageCircle, User, MapPin, Banknote, Wifi, Coffee, Calendar, Compass, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Listing } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  listing: Listing;
  onViewProfile?: (userId: string) => void;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  createdAt: any;
}

interface UserProfile {
  displayName?: string;
  photoURL?: string;
  phone?: string;
  bio?: string;
}

export default function ChatModal({ isOpen, onClose, receiverId, receiverName, listing, onViewProfile }: ChatModalProps) {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // States to fetch real profiles and full listing data
  const [receiverProfile, setReceiverProfile] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fullListing, setFullListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(false);

  // 1. Monitor Messages
  useEffect(() => {
    if (!user || !isOpen) return;

    const convId = [user.uid, receiverId].sort().join('_');

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', convId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      console.error("Chat fetch error:", err);
    });

    return () => unsubscribe();
  }, [user, isOpen, receiverId, listing.id]);

  // 2. Fetch Receiver Profile dynamically from Firestore for 'PROPER NAMES'
  useEffect(() => {
    if (!receiverId || !isOpen) return;
    const fetchReceiver = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', receiverId));
        if (docSnap.exists()) {
          setReceiverProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        console.error("Error fetching receiver profile:", err);
      }
    };
    fetchReceiver();
  }, [receiverId, isOpen]);

  // 3. Fetch current user profile from Firestore for 'PROPER NAMES'
  useEffect(() => {
    if (!user?.uid || !isOpen) return;
    const fetchUserProf = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchUserProf();
  }, [user?.uid, isOpen]);

  // 4. Fetch complete Listing details dynamically from Firestore to show 'PROPER' on right side
  useEffect(() => {
    if (!listing?.id || !isOpen) return;
    const fetchListing = async () => {
      setLoadingListing(true);
      try {
        const docSnap = await getDoc(doc(db, 'listings', listing.id));
        if (docSnap.exists()) {
          setFullListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        }
      } catch (err) {
        console.error("Error fetching listing inside ChatModal:", err);
      } finally {
        setLoadingListing(false);
      }
    };
    fetchListing();
  }, [listing?.id, isOpen]);

  const finalReceiverName = receiverProfile?.displayName || receiverName || 'User';
  const finalReceiverPhoto = receiverProfile?.photoURL || null;

  const finalUserName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Me';
  const finalUserPhoto = userProfile?.photoURL || user?.photoURL || null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText.trim();
    setInputText('');

    const convId = [user.uid, receiverId].sort().join('_');

    try {
      // 1. Add Message
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: user.uid,
        senderName: finalUserName,
        receiverId: receiverId,
        conversationId: convId,
        participants: [user.uid, receiverId],
        listingId: listing.id,
        createdAt: serverTimestamp(),
      });

      // 2. Update/Create Conversation for Inbox
      await setDoc(doc(db, 'conversations', convId), {
        participants: [user.uid, receiverId],
        lastMessage: text,
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
        listingId: listing.id,
        listingTitle: fullListing?.title || listing.title,
        listingArea: fullListing?.area || listing.area,
        users: {
          [user.uid]: { name: finalUserName, photo: finalUserPhoto },
          [receiverId]: { name: finalReceiverName, photo: finalReceiverPhoto }
        }
      }, { merge: true });

      // 3. Create real-time notification in Firestore for Receiver
      const notifyDocRef = doc(collection(db, 'notifications'));
      await setDoc(notifyDocRef, {
        id: notifyDocRef.id,
        userId: receiverId,
        titleEn: `New message from ${finalUserName}`,
        textEn: `"${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
        titleUr: `${finalUserName} ki taraf se naya message`,
        textUr: `"${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
        read: false,
        createdAt: Date.now(),
        type: 'chat',
        relatedId: convId
      });

    } catch (err) {
      console.error("Msg send error:", err);
    }
  };

  if (!isOpen) return null;

  // Resolve Listing Image for display
  const mockImagesByHash = [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80"
  ];
  const charSum = (fullListing?.title || listing.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackImage = mockImagesByHash[charSum % mockImagesByHash.length];
  const listingImage = (fullListing?.images && fullListing.images.length > 0)
    ? fullListing.images[0]
    : (fullListing?.imageUrl || listing.imageUrl || fallbackImage);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%', scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%', scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg md:max-w-4xl lg:max-w-5xl bg-white sm:rounded-[2.5rem] h-[85vh] sm:h-[620px] flex overflow-hidden shadow-2xl border border-gray-100"
      >
        {/* LEFT COLUMN: CHAT INTERFACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Chat Header */}
          <div className="p-4 md:p-5 bg-gradient-to-r from-primary to-primary-dark text-white flex items-center justify-between shadow-md">
            <button 
              onClick={() => onViewProfile?.(receiverId)}
              className="flex items-center gap-3 text-left hover:opacity-90 active:scale-[0.98] transition-all group"
            >
              <div className="relative">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/10 overflow-hidden shadow-inner group-hover:scale-105 transition-all">
                  {finalReceiverPhoto ? (
                    <img src={finalReceiverPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white/95" />
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full" />
              </div>
              <div>
                <h3 className="font-extrabold text-base md:text-lg leading-none mb-1 flex items-center gap-1.5">
                  {finalReceiverName}
                  <span className="text-[8px] bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-widest font-black leading-none">View Profile</span>
                </h3>
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/85 line-clamp-1 max-w-[180px] sm:max-w-xs md:max-w-md">
                  Discussing: {listing.title}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button onClick={onClose} className="p-2.5 hover:bg-white/15 rounded-2xl transition-all cursor-pointer">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          {/* Messages Space */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-bounce">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h4 className="font-black text-gray-800 text-lg">Baat shuru karein!</h4>
                <p className="text-gray-400 text-xs font-semibold max-w-xs leading-relaxed">Landlord se accommodation ke baray mein sawal pouchein.</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.senderId === user?.uid;
                const showName = idx === 0 || messages[idx - 1].senderId !== m.senderId;
                const time = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div 
                    key={m.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {showName && (
                      <button 
                        onClick={() => !isMe && onViewProfile?.(m.senderId)}
                        className={`text-[9px] font-black uppercase tracking-widest mb-1 mt-2 ${isMe ? 'mr-1.5 text-primary/60' : 'ml-1.5 text-gray-400 hover:text-primary transition-colors'}`}
                      >
                        {isMe ? 'Aap' : m.senderName}
                      </button>
                    )}
                    <div className={`max-w-[85%] p-3.5 rounded-2xl font-semibold text-sm shadow-sm transition-all relative group ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none shadow-primary/5' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      {time && (
                        <span className={`block text-[8px] mt-1.5 font-bold uppercase tracking-wider opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                          {time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-100 bg-white flex gap-3 items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Apna paigham likhein..."
              className="flex-1 px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-gray-400"
            />
            <button 
              type="submit"
              className="w-12 h-12 md:w-13 md:h-13 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: PROPER ACCOMMODATION DETAIL SIDEBAR */}
        <div className="hidden md:flex flex-col w-[350px] border-l border-gray-100 bg-slate-50/40 h-full overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Listing Details</h4>
          </div>

          {loadingListing ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details download ho rahi hain...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cover Photo */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm flex items-center justify-center group">
                <img src={listingImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                {fullListing?.verified && (
                  <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                    Verified
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                  {fullListing?.type || listing.type || 'Flat'}
                </span>
              </div>

              {/* Title & Area */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-base text-gray-900 leading-snug tracking-tight">
                  {fullListing?.title || listing.title}
                </h4>
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" /> {fullListing?.area || listing.area || 'Karachi'}
                </p>
                {fullListing?.university && (
                  <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider pt-0.5">
                    🎓 Near: {fullListing.university}
                  </p>
                )}
              </div>

              {/* Price Details */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-500" /> Rent / Month
                  </p>
                  <p className="text-sm font-black text-primary mt-1">
                    Rs. {fullListing?.rent ? fullListing.rent.toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    🔒 Security Dep.
                  </p>
                  <p className="text-sm font-extrabold text-gray-750 mt-1">
                    Rs. {fullListing?.securityDeposit ? fullListing.securityDeposit.toLocaleString() : '0'}
                  </p>
                </div>
              </div>

              {/* Quick Specs / Badges */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suhooliyat & Features</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    fullListing?.wifi 
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}>
                    <Wifi className="w-3.5 h-3.5 shrink-0" />
                    <span>WiFi: {fullListing?.wifi ? 'Yes' : 'No'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    fullListing?.ac 
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}>
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>AC: {fullListing?.ac ? 'Yes' : 'No'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    fullListing?.mealsIncluded 
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}>
                    <Coffee className="w-3.5 h-3.5 shrink-0" />
                    <span>Meals: {fullListing?.mealsIncluded ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-600 flex items-center gap-2 text-[11px] font-bold truncate">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Move: {fullListing?.moveInDate || 'Immediate'}</span>
                  </div>
                </div>
              </div>

              {/* Description field */}
              {fullListing?.description && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra Details</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold bg-white p-3.5 rounded-2xl border border-gray-100 max-h-[100px] overflow-y-auto">
                    {fullListing.description}
                  </p>
                </div>
              )}

              {/* Quick Contact Panel */}
              <div className="bg-gradient-to-br from-emerald-50 to-primary/5 p-4 rounded-3xl border border-emerald-100/40 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-extrabold text-xs shadow-inner uppercase">
                    {finalReceiverName[0]}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Posted By</p>
                    <p className="text-sm font-black text-gray-800 leading-tight">{finalReceiverName}</p>
                    {receiverProfile?.phone && (
                      <p className="text-[10px] font-bold text-gray-500 mt-0.5">{receiverProfile.phone}</p>
                    )}
                  </div>
                </div>

                {fullListing?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${fullListing.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl text-center text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:scale-[1.01] active:scale-99 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp Contact</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { MessageSquare, User, MapPin, ChevronRight, Clock, Send, MessageCircle, ArrowLeft, Trash2, X, Sparkles, Phone } from 'lucide-react';
import { Listing } from '../types';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastSenderId?: string;
  updatedAt: any;
  listingId: string;
  listingTitle: string;
  listingArea: string;
  users: {
    [key: string]: { name: string; photo: string | null };
  };
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

interface FloatingChatPanelProps {
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
}

export default function FloatingChatPanel({ onClose, onViewProfile }: FloatingChatPanelProps) {
  const [user] = useAuthState(auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // Message-specific states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // States to keep real profiles for PROPER NAMES
  const [activeReceiverProfile, setActiveReceiverProfile] = useState<UserProfile | null>(null);
  const [activeSenderProfile, setActiveSenderProfile] = useState<UserProfile | null>(null);

  // Sub for conversations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allConvs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      const validConvs = allConvs.filter(c => {
        const parts = c.id.split('_');
        if (parts.length !== 2) {
          console.warn("Found malformed floating conversation ID format, filtering locally:", c.id);
          return false;
        }
        return true;
      });
      setConversations(validConvs);
      setLoadingConvs(false);
    }, (err) => {
      console.error("Floating Inbox load error:", err);
      setLoadingConvs(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sub for messages inside selected conversation
  useEffect(() => {
    if (!user || !selectedConv) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedConv.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      console.error("Floating Chat message load error:", err);
    });

    return () => unsubscribe();
  }, [user, selectedConv]);

  // Fetch Receiver Profile for proper display names dynamically
  useEffect(() => {
    if (!user || !selectedConv) {
      setActiveReceiverProfile(null);
      return;
    }
    const otherUserId = selectedConv.participants.find(p => p !== user.uid) || '';
    if (!otherUserId) return;

    getDoc(doc(db, 'users', otherUserId)).then((docSnap) => {
      if (docSnap.exists()) {
        setActiveReceiverProfile(docSnap.data() as UserProfile);
      }
    }).catch(err => console.error("Error loading chat receiver profile:", err));
  }, [selectedConv, user]);

  // Fetch Sender Profile for proper sender names dynamically
  useEffect(() => {
    if (!user) {
      setActiveSenderProfile(null);
      return;
    }

    getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
      if (docSnap.exists()) {
        setActiveSenderProfile(docSnap.data() as UserProfile);
      }
    }).catch(err => console.error("Error loading chat sender profile:", err));
  }, [user]);

  const finalSenderName = activeSenderProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Me';
  const finalSenderPhoto = activeSenderProfile?.photoURL || user?.photoURL || null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !selectedConv) return;

    const text = inputText.trim();
    setInputText('');

    const otherUserId = selectedConv.participants.find(p => p !== user.uid) || user.uid;
    const finalReceiverName = activeReceiverProfile?.displayName || selectedConv.users[otherUserId]?.name || 'User';
    const finalReceiverPhoto = activeReceiverProfile?.photoURL || selectedConv.users[otherUserId]?.photo || null;

    try {
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: user.uid,
        senderName: finalSenderName,
        receiverId: otherUserId,
        conversationId: selectedConv.id,
        participants: [user.uid, otherUserId],
        listingId: selectedConv.listingId,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'conversations', selectedConv.id), {
        participants: [user.uid, otherUserId],
        lastMessage: text,
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
        listingId: selectedConv.listingId,
        listingTitle: selectedConv.listingTitle,
        listingArea: selectedConv.listingArea,
        users: {
          [user.uid]: { name: finalSenderName, photo: finalSenderPhoto },
          [otherUserId]: { name: finalReceiverName, photo: finalReceiverPhoto }
        }
      }, { merge: true });

      // Create real-time notification in Firestore for Receiver
      const notifyDocRef = doc(collection(db, 'notifications'));
      await setDoc(notifyDocRef, {
        id: notifyDocRef.id,
        userId: otherUserId,
        titleEn: `New message from ${finalSenderName}`,
        textEn: `"${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
        titleUr: `${finalSenderName} ki taraf se naya message`,
        textUr: `"${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
        read: false,
        createdAt: Date.now(),
        type: 'chat',
        relatedId: selectedConv.id
      });

    } catch (err) {
      console.error("Floating Msg send error:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-white p-6 justify-center items-center text-center space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-gray-300 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Sign In required</h3>
          <p className="text-xs text-gray-500 font-medium max-w-xs mt-1">Inbox dekhne aur owners ke sath live chat karne ke liye apna account sign in karein.</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-primary text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all w-full mt-4 cursor-pointer shadow-lg shadow-primary/20"
        >
          Close Panel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <AnimatePresence mode="wait">
        {!selectedConv ? (
          // Inbox Screen
          <motion.div 
            key="inbox"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col h-full"
          >
            {/* Inbox Header */}
            <div className="p-5 bg-gradient-to-r from-primary to-primary-dark text-white flex items-center justify-between border-b border-primary-dark/15 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">Mera Inbox</h3>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/80">
                    {conversations.length} Active chats
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                title="Inbox band karein"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {loadingConvs ? (
                <div className="flex flex-col items-center justify-center h-full py-12 space-y-2">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading chats...</p>
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((c) => {
                  const otherUserId = c.participants.find(p => p !== user.uid) || user.uid;
                  const otherUser = (c.users && c.users[otherUserId]) || { name: 'User', photo: null };
                  const isMeLast = c.lastSenderId === user.uid;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConv(c)}
                      className={`w-full text-left bg-white p-4 rounded-2xl border transition-all flex items-center gap-3 relative hover:scale-[1.01] hover:shadow-lg hover:border-primary/20 cursor-pointer ${!isMeLast ? 'border-primary/20 bg-primary/5 shadow-inner' : 'border-gray-100 shadow-xs'}`}
                    >
                      {!isMeLast && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>
                        </div>
                      )}
                      
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner overflow-hidden">
                          {otherUser.photo ? (
                            <img src={otherUser.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-gray-950 tracking-tight truncate pr-8">
                            {otherUser.name}
                          </h4>
                          <span className="text-[8px] font-bold text-gray-400">
                            {c.updatedAt ? new Date(c.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        
                        <p className="text-[9px] text-primary/80 font-bold truncate mt-0.5 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.listingTitle}
                        </p>

                        <p className="text-xs text-gray-500 truncate mt-1 leading-tight max-w-[190px]">
                          <span className="font-black text-gray-400">
                            {isMeLast ? 'Aap:' : `${otherUser.name.split(' ')[0]}:`}
                          </span>
                          {" "}{c.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col h-full justify-center items-center text-center p-8 space-y-3 opacity-40 py-20">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-bold text-gray-950">Koi active chat nahi hai</p>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">Owners se rabta kar ke yahan live chat shuru karein.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // Active Messages / Room Chat Screen inside Floating Window!
          (() => {
            const otherUserId = selectedConv.participants.find(p => p !== user.uid) || user.uid;
            const otherUser = activeReceiverProfile 
              ? { name: activeReceiverProfile.displayName || 'User', photo: activeReceiverProfile.photoURL }
              : ((selectedConv.users && selectedConv.users[otherUserId]) || { name: 'User', photo: null });

            return (
              <motion.div 
                key="chat-thread"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col h-full bg-white"
              >
                {/* Active Chat Header */}
                <div className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white flex items-center justify-between shrink-0 border-b border-primary-dark/15 shadow-sm">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <button 
                      onClick={() => setSelectedConv(null)}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-all mr-0.5 cursor-pointer"
                      title="Back to inbox"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => onViewProfile?.(otherUserId)}
                      className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity min-w-0 group"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-all">
                        {otherUser.photo ? (
                          <img src={otherUser.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-xs truncate flex items-center gap-1 leading-tight group-hover:text-emerald-100 transition-colors">
                          {otherUser.name}
                        </h3>
                        <p className="text-[8px] text-white/80 font-bold tracking-wider uppercase truncate leading-none mt-0.5">
                          Discussing: {selectedConv.listingTitle}
                        </p>
                      </div>
                    </button>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-24 space-y-2 p-6">
                      <MessageCircle className="w-8 h-8 text-primary animate-bounce" />
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Paigham bhejein!</p>
                      <p className="text-[10px] text-gray-500 font-bold max-w-xs leading-relaxed">Apna sawal likh kar baat shuru karein.</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMe = m.senderId === user.uid;
                      const showName = idx === 0 || messages[idx - 1].senderId !== m.senderId;
                      const time = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                      return (
                        <div 
                          key={m.id} 
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {showName && (
                            <span className={`text-[8px] font-black uppercase tracking-widest mb-0.5 mt-1.5 ${isMe ? 'mr-1 text-primary/50' : 'ml-1 text-gray-400'}`}>
                              {isMe ? 'Aap' : m.senderName}
                            </span>
                          )}
                          <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl font-semibold text-xs shadow-xs transition-all ${
                            isMe 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                          }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            {time && (
                              <span className={`block text-[7px] mt-1 font-bold uppercase opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
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

                {/* Live Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Apna paigham likhein..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-primary/20 transition-all placeholder:text-gray-400"
                  />
                  <button 
                    type="submit"
                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/25"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}

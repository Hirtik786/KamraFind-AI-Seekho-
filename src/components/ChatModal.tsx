import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { X, Send, MessageCircle, User } from 'lucide-react';
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

export default function ChatModal({ isOpen, onClose, receiverId, receiverName, listing, onViewProfile }: ChatModalProps) {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    const convId = [user.uid, receiverId, listing.id].sort().join('_');

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText.trim();
    setInputText('');

    const convId = [user.uid, receiverId, listing.id].sort().join('_');

    try {
      // 1. Add Message
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'User',
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
        listingTitle: listing.title,
        listingArea: listing.area,
        users: {
          [user.uid]: { name: user.displayName || 'Me', photo: user.photoURL },
          [receiverId]: { name: receiverName, photo: null }
        }
      }, { merge: true });

    } catch (err) {
      console.error("Msg send error:", err);
    }
  };

  if (!isOpen) return null;

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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-lg bg-white sm:rounded-[2.5rem] h-[80vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Chat Header */}
        <div className="p-6 bg-primary text-white flex items-center justify-between">
          <button 
            onClick={() => onViewProfile?.(receiverId)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-1">
                {receiverName}
                <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-widest">View Profile</span>
              </h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/70">
                Discussing: {listing.title}
              </p>
            </div>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Space */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <MessageCircle className="w-12 h-12" />
              <p className="font-bold">Salaam karein aur baat shuru karein!</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.senderId === user?.uid;
              const showName = idx === 0 || messages[idx - 1].senderId !== m.senderId;
              const time = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {showName && (
                    <button 
                      onClick={() => !isMe && onViewProfile?.(m.senderId)}
                      className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isMe ? 'mr-2 text-primary/50' : 'ml-2 text-gray-400 hover:text-primary transition-colors'}`}
                    >
                      {isMe ? 'Aap' : m.senderName}
                    </button>
                  )}
                  <div className={`max-w-[85%] p-3.5 sm:p-4 rounded-2xl font-medium text-sm shadow-sm transition-all relative group ${
                    isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {m.text}
                    {time && (
                      <span className={`block text-[8px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
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
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-6 py-4 bg-white rounded-2xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          <button 
            type="submit"
            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

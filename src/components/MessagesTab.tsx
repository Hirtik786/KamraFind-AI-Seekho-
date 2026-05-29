import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { MessageSquare, User, MapPin, ChevronRight, Clock } from 'lucide-react';
import ChatModal from './ChatModal';
import PublicProfileModal from './PublicProfileModal';
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

export default function MessagesTab() {
  const [user] = useAuthState(auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

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
          console.warn("Found malformed conversation ID format, filtering locally:", c.id);
          return false;
        }
        return true;
      });
      setConversations(validConvs);
      setLoading(false);
    }, (err) => {
      console.error("Inbox error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return (
    <div className="max-w-md mx-auto text-center p-12 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
        <MessageSquare className="w-10 h-10 text-gray-300" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Login Karein</h2>
        <p className="text-gray-500 font-medium">Messages dekhne ke liye login karna zaroori hai.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Inbox <span className="text-primary text-xl">.</span></h2>
        <span className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
          {conversations.length} Active Chats
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {conversations.map((c) => {
            const otherUserId = c.participants.find(p => p !== user.uid) || user.uid;
            const otherUser = (c.users && c.users[otherUserId]) || { name: 'User', photo: null };
            const isMeLast = c.lastSenderId === user.uid;
            
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedChat(c)}
                className={`w-full text-left bg-white p-6 rounded-[2.2rem] border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all flex items-center gap-5 group relative ${!isMeLast ? 'border-primary/10' : 'border-gray-100'}`}
              >
                {!isMeLast && (
                  <div className="absolute top-6 right-8">
                    <span className="bg-primary text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">NEW</span>
                  </div>
                )}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    {otherUser.photo ? (
                      <img src={otherUser.photo} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                       {otherUser.name}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      {c.updatedAt ? new Date(c.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  
                  {/* Room Link Design */}
                  <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-gray-50 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest mb-3 border border-gray-100 group-hover:bg-primary/5 transition-colors">
                    <MapPin className="w-3 h-3" />
                    <span>Room: {c.listingTitle}</span>
                  </div>

                  <p className="text-sm text-gray-500 font-medium truncate">
                    <span className="font-black text-gray-400 mr-1">
                      {isMeLast ? 'Aap:' : `${otherUser.name.split(' ')[0]}:`}
                    </span> 
                    <span className="italic">"{c.lastMessage}"</span>
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-gray-50 space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Koi messages nahi hain</h3>
          <p className="text-gray-500 font-medium max-w-xs mx-auto">Jab aap kisi owner se rabta karein ge toh yahan chats nazar ayain gi.</p>
        </div>
      )}

      {selectedChat && (
        <ChatModal
          isOpen={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          receiverId={selectedChat.participants.find(p => p !== user?.uid) || ''}
          receiverName={selectedChat.users[selectedChat.participants.find(p => p !== user?.uid) || user?.uid || '']?.name || 'User'}
          listing={{ id: selectedChat.listingId, title: selectedChat.listingTitle, area: selectedChat.listingArea } as Listing}
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, logout, db, handleFirestoreError, OperationType } from '../firebase';
import { Listing } from '../types';
import { 
  LogOut, 
  MapPin, 
  Trash2, 
  User as UserIcon, 
  ShieldAlert, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X, 
  Phone, 
  Calendar,
  Layers,
  Settings as SettingsIcon,
  RefreshCw,
  Mail
} from 'lucide-react';
import { doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

interface ProfileTabProps {
  listings: Listing[];
  lang: 'EN' | 'UR';
}

interface UserProfileData {
  displayName?: string;
  phone?: string;
  bio?: string;
  photoURL?: string;
  lastLogin?: number;
  emailVerified?: boolean;
}

export default function ProfileTab({ listings, lang }: ProfileTabProps) {
  const [user, loading] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');

  const t = {
    EN: {
      notLoggedInTitle: "You are not logged in",
      notLoggedInDesc: "Please log in to view your profile and manage your listings.",
      unverified: "Unverified",
      verified: "Verified",
      phone: "Phone",
      memberSince: "Member Since",
      activeListingsHeader: "Active Listings",
      editProfile: "Edit Profile",
      logout: "Logout",
      totalPosts: "Total Posts",
      accountState: "Account State",
      actionNeeded: "Action Needed",
      verificationDesc: "Please verify your email address to start posting accommodation listings.",
      accountInfo: "Account Info",
      primaryEmail: "Primary Email",
      contactNumber: "Contact Number",
      notAdded: "Not Added",
      joinDate: "Join Date",
      activeListingsTitle: "Your Active Listings",
      noListingsTitle: "No listings found",
      noListingsDesc: "You haven't posted any room or flat yet. Post your first listing now!",
      editProfileModalTitle: "Modify Profile",
      displayNameLabel: "Display Name",
      placeholderName: "Enter your name",
      phoneLabel: "Phone Number",
      placeholderPhone: "e.g. 03001234567",
      bioLabel: "Bio / About",
      placeholderBio: "Tell something about yourself...",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      saving: "Saving...",
      deleteConfirm: "Do you really want to delete this listing?",
      karachiPakistan: "Karachi, Pakistan"
    },
    UR: {
      notLoggedInTitle: "Aap Login Nahi Hain",
      notLoggedInDesc: "Please login karein apni profile dekhne aur listings manage karne ke liye.",
      unverified: "Ghair Tasdeeq",
      verified: "Tasdeeq Shuda",
      phone: "Phone Number",
      memberSince: "Member Since",
      activeListingsHeader: "Aapki listings",
      editProfile: "Edit Profile",
      logout: "Logout",
      totalPosts: "Kul Posts",
      accountState: "Account State",
      actionNeeded: "Zaroori Action",
      verificationDesc: "Apni email verify karein takay aap listings post kar saken.",
      accountInfo: "Account Details",
      primaryEmail: "E-mail Address",
      contactNumber: "Contact Number",
      notAdded: "Nahi likha",
      joinDate: "Join Date",
      activeListingsTitle: "Aapki Active Listings",
      noListingsTitle: "Koi listing nahi hai",
      noListingsDesc: "Aapne abhi tak koi kamra ya ghar post nahi kiya. Shuru karein!",
      editProfileModalTitle: "Profile Edit Karein",
      displayNameLabel: "Aap Ka Naam",
      placeholderName: "Apna naam likhein",
      phoneLabel: "Phone Number",
      placeholderPhone: "03xx xxxxxxx",
      bioLabel: "Bio / About",
      placeholderBio: "Apne baray mein kuch btayein...",
      cancel: "Wapis",
      saveChanges: "Save Changes",
      saving: "Save ho raha hai...",
      deleteConfirm: "Aap ye listing parh-e-khatam karna chahte hain?",
      karachiPakistan: "Karachi, Pakistan"
    }
  }[lang];

  const userListings = listings.filter(l => l.ownerId === user?.uid);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfileData;
            setProfileData(data);
            setEditName(data.displayName || user.displayName || '');
            setEditPhone(data.phone || '');
            setEditBio(data.bio || '');
          } else {
            setEditName(user.displayName || '');
          }
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /><p className="text-sm text-gray-500 ml-4 font-bold">{t.saving}</p></div>;
  
  if (!user) return (
    <div className="max-w-md mx-auto text-center p-12 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
        <ShieldAlert className="w-10 h-10 text-gray-300" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{t.notLoggedInTitle}</h2>
        <p className="text-gray-500 font-medium">{t.notLoggedInDesc}</p>
      </div>
    </div>
  );

  const displayName = profileData?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
  const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: editName,
        phone: editPhone,
        bio: editBio,
        photoURL: photoURL,
        email: user.email,
        lastUpdated: Date.now(),
        emailVerified: user.emailVerified
      }, { merge: true });
      
      setProfileData({
        ...profileData,
        displayName: editName,
        phone: editPhone,
        bio: editBio
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Masla hua profile update karte waqt.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      try {
        await deleteDoc(doc(db, 'listings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `listings/${id}`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Upper Grid: Profile Info & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full ring-4 ring-primary/5 overflow-hidden shadow-xl">
                  <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-primary">
                  {user.emailVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 text-red-500" />}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{displayName}</h2>
                    {!user.emailVerified && (
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
                        {t.unverified}
                      </span>
                    )}
                    {user.emailVerified && (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {t.verified}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4" /> {user.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.phone}</p>
                     <p className="text-sm font-bold text-gray-700 mt-1">{profileData?.phone || t.notAdded}</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.memberSince}</p>
                     <p className="text-sm font-bold text-gray-700 mt-1">May 2026</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2 md:col-span-1">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.activeListingsHeader}</p>
                     <p className="text-sm font-bold text-primary mt-1">{userListings.length}</p>
                   </div>
                </div>

                {profileData?.bio && (
                  <div className="pt-4 px-1">
                    <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                      "{profileData.bio}"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-6">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    <Edit3 className="w-4 h-4" /> {t.editProfile}
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-red-500 border border-red-100 rounded-2xl font-bold hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> {t.logout}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Activity Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col justify-between h-32">
                <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center text-primary">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-2xl font-black text-primary">{userListings.length}</p>
                   <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">{t.totalPosts}</p>
                </div>
             </div>
             <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-200 flex flex-col justify-between h-32">
                <div className="bg-gray-200/50 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-2xl font-black text-gray-700">Live</p>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.accountState}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Account Details Sidebar */}
        <div className="space-y-6">
           {!user.emailVerified && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-red-50 rounded-[2.2rem] p-6 border-2 border-red-100 space-y-4"
             >
                <div className="flex items-center gap-3 text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                  <h4 className="font-black text-xs uppercase tracking-widest">{t.actionNeeded}</h4>
                </div>
                <p className="text-sm font-bold text-red-900 leading-tight">{t.verificationDesc}</p>
             </motion.div>
           )}

           <div className="bg-white rounded-[2.2rem] p-6 border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> {t.accountInfo}
              </h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                      <Mail className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.primaryEmail}</p>
                       <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                      <Phone className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.contactNumber}</p>
                       <p className="text-sm font-bold text-gray-700">{profileData?.phone || t.notAdded}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                      <Calendar className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.joinDate}</p>
                       <p className="text-sm font-bold text-gray-700">08th May, 2026</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* User Listings Sections */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t.activeListingsTitle}</h3>
           <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
             {userListings.length} Listings
           </span>
        </div>

        {userListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map((l) => (
              <motion.div 
                layout
                key={l.id}
                className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <button 
                    onClick={() => handleDeleteListing(l.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{l.title}</h4>
                  <p className="text-xs text-gray-500 font-semibold mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {l.area} · Near {l.university}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                     <p className="text-xl font-black text-primary">Rs. {l.rent.toLocaleString()}</p>
                     <div className="bg-accent/10 px-3 py-1 rounded-lg">
                       <span className="text-[10px] font-black text-accent uppercase tracking-widest">{l.type}</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-gray-50">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Layers className="w-10 h-10 text-gray-200" />
             </div>
             <h3 className="text-xl font-bold text-gray-900">{t.noListingsTitle}</h3>
             <p className="text-gray-500 font-medium mt-2 max-w-xs mx-auto">{t.noListingsDesc}</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsEditing(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-8 md:p-10"
             >
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t.editProfileModalTitle}</h3>
                   <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                     <X className="w-5 h-5 text-gray-400" />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">{t.displayNameLabel}</label>
                     <input 
                       type="text" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all"
                       placeholder={t.placeholderName}
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">{t.phoneLabel}</label>
                     <input 
                       type="text" 
                       value={editPhone}
                       onChange={(e) => setEditPhone(e.target.value)}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all"
                       placeholder={t.placeholderPhone}
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">{t.bioLabel}</label>
                     <textarea 
                       value={editBio}
                       onChange={(e) => setEditBio(e.target.value)}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all h-32 resize-none"
                       placeholder={t.placeholderBio}
                     />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                         onClick={() => setIsEditing(false)}
                         className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                         {t.cancel}
                      </button>
                      <button 
                         onClick={handleUpdateProfile}
                         disabled={saving}
                         className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                      >
                         {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                         {saving ? t.saving : t.saveChanges}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

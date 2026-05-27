import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Home, MapPin, School, Banknote, Users, Coffee, Wifi, Wind, Calendar, User, Phone, AlignLeft, LogIn, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, loginWithGoogle } from '../firebase';
import { Listing, AccommodationType, GenderPreference, UtilitiesType } from '../types';
import { KARACHI_AREAS, UNIVERSITIES } from '../constants';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

interface PostListingTabProps {
  onAdd: (listing: Listing) => void;
  onSuccess: () => void;
  onLoginClick?: () => void;
  lang: 'EN' | 'UR';
}

export default function PostListingTab({ onAdd, onSuccess, onLoginClick, lang }: PostListingTabProps) {
  const [user, loading] = useAuthState(auth);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = {
    EN: {
      postTitle: "Post Room / Flat Details",
      subtitle: "Fill the form to list your accommodation for students.",
      basicInfo: "Basic Information",
      listingTitle: "Listing Title",
      listingTitlePlaceholder: "e.g. Spacious room near FAST for boys",
      roomType: "Room Type",
      genderPref: "Gender Preference",
      boysOnly: "Boys Only",
      girlsOnly: "Girls Only",
      familyAny: "Family / Any",
      locationArea: "Location & Area",
      area: "Area",
      nearestUni: "Nearest University",
      rentSecurity: "Rent & Security",
      monthlyRent: "Monthly Rent (PKR)",
      securityDeposit: "Security Deposit (PKR)",
      amenitiesFeatures: "Amenities & Features",
      meals: "Meals",
      wifi: "WiFi",
      ac: "AC",
      utilities: "Utilities:",
      utilitiesInc: "Included",
      utilitiesNo: "No",
      utilitiesPartial: "Partial",
      seatsAvailable: "Seats Available",
      moveInDate: "Move-in Date",
      roomPhotos: "Room / Flat Photos",
      dragDropText: "Drag & drop room photos here or click to browse",
      selectUpTo: "Select up to 4 photographs (JPEG, PNG).",
      coverSticker: "Cover",
      contactPerson: "Contact Person",
      contactName: "Name",
      contactNamePlaceholder: "Owner/Student Name",
      whatsappNumber: "WhatsApp Number",
      whatsAppPlaceholder: "+923001234567",
      description: "Description (Extra details)",
      descPlaceholder: "Tell students about the flatmates, the area vibes, or any specific rules...",
      postBtn: "Post Listing",
      btnPosting: "Uploading details...",
      accountRequired: "Account Banayein",
      loginRequiredText: "Listing daalne ke liye login karna zaroori hai takey log aap se rabta kar sakein.",
      loginBtn: "Login to Continue",
      addedSuccess: "Aapki listing shaamil ho gayi!",
      redirecting: "Redirecting to search...",
      loadingDetails: "Loading details..."
    },
    UR: {
      postTitle: "Kamra Ki Details Daalo",
      subtitle: "Form bhar kar student accommodation share karen.",
      basicInfo: "Zaroori Maloomat (Basic)",
      listingTitle: "Listing Ka Title",
      listingTitlePlaceholder: "Maslan: FAST ke qareeb boys ke liye room khali hai",
      roomType: "Kamre Ki Type",
      genderPref: "Gender Preference",
      boysOnly: "Sirf Larkay",
      girlsOnly: "Sirf Larkiyan",
      familyAny: "Family / Koi bhi",
      locationArea: "Location aur Area",
      area: "Area / Ilaqa",
      nearestUni: "Qareebi University",
      rentSecurity: "Rent aur Security",
      monthlyRent: "Mahana Rent (Rs.)",
      securityDeposit: "Security Deposit (Rs.)",
      amenitiesFeatures: "Suhooliyat aur Features",
      meals: "Khana",
      wifi: "WiFi",
      ac: "AC",
      utilities: "Utilities:",
      utilitiesInc: "Shamil Hai",
      utilitiesNo: "Nahi Hai",
      utilitiesPartial: "Kuch Shamil",
      seatsAvailable: "Khali Seats",
      moveInDate: "Kab se Khali Hai Date",
      roomPhotos: "Kamray Ki Pictures (Add Room/Flat Photos)",
      dragDropText: "Room photos yahan drag/drop karein ya click kar ke browse karein",
      selectUpTo: "Zyada se zyada 4 pictures upload karein (JPEG, PNG).",
      coverSticker: "Cover Photo",
      contactPerson: "Rabta Karne Wala",
      contactName: "Naam",
      contactNamePlaceholder: "Owner ya Student Ka Naam",
      whatsappNumber: "WhatsApp Number",
      whatsAppPlaceholder: "+923001234567",
      description: "Description (Mazeed details)",
      descPlaceholder: "Flatmates, room key rules, ya area ke baray mein mazeed details likhein...",
      postBtn: "Listing Daalo",
      btnPosting: "Bhej rahe hain...",
      accountRequired: "Account Banayein",
      loginRequiredText: "Listing daalne ke liye login karna zaroori hai takey log aap se rabta kar sakein.",
      loginBtn: "Login to Continue",
      addedSuccess: "Aapki listing kamyabi se shamil ho gayi!",
      redirecting: "Wapis search page par ja rahe hain...",
      loadingDetails: "Details load ho rahi hain..."
    }
  }[lang];

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const [formData, setFormData] = useState<Partial<Listing>>({
    type: 'Hostel',
    area: KARACHI_AREAS[0],
    university: UNIVERSITIES[0],
    gender: 'Boys',
    mealsIncluded: false,
    utilities: 'Yes',
    wifi: true,
    ac: false,
    seatsAvailable: 1,
    totalRoommates: 0,
    images: [],
  });

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const base64Promises: Promise<string>[] = [];
    
    const currentImages = formData.images || [];
    const remainingSlots = 4 - currentImages.length;
    if (remainingSlots <= 0) {
      alert("Aap maximum 4 images upload kar sakte hain.");
      setUploading(false);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert("Sirf images upload karein!");
        continue;
      }
      base64Promises.push(compressImage(file));
    }

    try {
      const results = await Promise.all(base64Promises);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...results]
      }));
    } catch (err) {
      console.error("Compression error:", err);
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    
    try {
      const newListing: Listing = {
        ...formData as Listing,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      };

      await onAdd(newListing);
      setIsSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Failed to add listing:", err);
      alert("Listing add karne mein masla hua. Please check if you filled all fields correctly.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">{t.loadingDetails}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 p-6">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 translate-y-1">
          <User className="w-10 h-10 text-primary -rotate-3" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{t.accountRequired}</h2>
          <p className="text-gray-500 max-w-xs mx-auto">{t.loginRequiredText}</p>
        </div>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl hover:brightness-105 transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          {t.loginBtn}
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-primary">{t.addedSuccess}</h2>
        <p className="text-gray-500">{t.redirecting}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t.postTitle}</h2>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Home className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.basicInfo}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.listingTitle}</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder={t.listingTitlePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t.roomType}</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccommodationType })}
                >
                  <option value="Hostel">Hostel</option>
                  <option value="Sharing Flat">Sharing Flat</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Full Apartment">Full Apartment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t.genderPref}</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderPreference })}
                >
                  <option value="Boys">{t.boysOnly}</option>
                  <option value="Girls">{t.girlsOnly}</option>
                  <option value="Any">{t.familyAny}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.locationArea}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.area}</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              >
                {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.nearestUni}</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              >
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Banknote className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.rentSecurity}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.monthlyRent}</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-primary">Rs.</span>
                <input
                  required
                  type="number"
                  placeholder="20,000"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, rent: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.securityDeposit}</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">Rs.</span>
                <input
                  required
                  type="number"
                  placeholder="20,000"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, securityDeposit: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Coffee className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.amenitiesFeatures}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.mealsIncluded}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, mealsIncluded: e.target.checked })}
              />
              <span className="text-sm font-medium">{t.meals}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.wifi}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })}
              />
              <span className="text-sm font-medium">{t.wifi}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.ac}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, ac: e.target.checked })}
              />
              <span className="text-sm font-medium">{t.ac}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <span className="text-sm font-medium text-gray-500">{t.utilities}</span>
              <select 
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer"
                onChange={(e) => setFormData({ ...formData, utilities: e.target.value as UtilitiesType })}
              >
                <option value="Yes">{t.utilitiesInc}</option>
                <option value="No">{t.utilitiesNo}</option>
                <option value="Partial">{t.utilitiesPartial}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> {t.seatsAvailable}
              </label>
              <input
                type="number"
                min="0"
                defaultValue={1}
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, seatsAvailable: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" /> {t.moveInDate}
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Upload Listings Images */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.roomPhotos}</h3>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50 dark:border-gray-850 dark:hover:border-emerald-500/50 bg-gray-50/50 dark:bg-slate-900/40"
            }`}
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
            onClick={() => document.getElementById('listing-images-upload')?.click()}
          >
            <input
              id="listing-images-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {t.dragDropText}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t.selectUpTo}
            </p>
          </div>

          {/* Show list of uploaded images */}
          {formData.images && formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-805 shadow-sm group">
                  <img
                    src={img}
                    alt={`Room photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge for cover photo on first index */}
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                      {t.coverSticker}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-750 shadow flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t.contactPerson}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.contactName}</label>
              <input
                required
                type="text"
                placeholder={t.contactNamePlaceholder}
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t.whatsappNumber}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder={t.whatsAppPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">{t.description}</label>
          <textarea
            rows={4}
            placeholder={t.descPlaceholder}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitLoading}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.btnPosting}</span>
            </>
          ) : (
            t.postBtn
          )}
        </button>
      </form>
    </div>
  );
}

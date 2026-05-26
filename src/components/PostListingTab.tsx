import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Home, MapPin, School, Banknote, Users, Coffee, Wifi, Wind, Calendar, User, Phone, AlignLeft, LogIn } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, loginWithGoogle } from '../firebase';
import { Listing, AccommodationType, GenderPreference, UtilitiesType } from '../types';
import { KARACHI_AREAS, UNIVERSITIES } from '../constants';

interface PostListingTabProps {
  onAdd: (listing: Listing) => void;
  onSuccess: () => void;
  onLoginClick?: () => void;
}

export default function PostListingTab({ onAdd, onSuccess, onLoginClick }: PostListingTabProps) {
  const [user, loading] = useAuthState(auth);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
  });

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
        <p className="text-gray-500 font-medium">Loading details...</p>
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
          <h2 className="text-2xl font-bold tracking-tight">Account Banayein</h2>
          <p className="text-gray-500 max-w-xs mx-auto">Listing daalne ke liye login karna zaroori hai takey log aap se rabta kar sakein.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl hover:brightness-105 transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          Login to Continue
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
        <h2 className="text-2xl font-bold text-primary">Aapki listing shaamil ho gayi!</h2>
        <p className="text-gray-500">Redirecting to search...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Kamara Ki Details Daalo</h2>
        <p className="text-gray-500">Fill the form to list your accommodation for students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <Home className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Zaroori Maloomat (Basic)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Listing Ka Title</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder="e.g. Spacious room near FAST for boys"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Kamre Ki Type</label>
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
                <label className="block text-sm font-semibold mb-1.5">Gender Preference</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderPreference })}
                >
                  <option value="Boys">Boys Only</option>
                  <option value="Girls">Girls Only</option>
                  <option value="Any">Family / Any</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Location & Area</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Area</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              >
                {KARACHI_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Nearest University</label>
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
            <h3 className="font-bold">Rent & Security</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Monthly Rent (PKR)</label>
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
              <label className="block text-sm font-semibold mb-1.5">Security Deposit (PKR)</label>
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
            <h3 className="font-bold">Amenities & Features</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.mealsIncluded}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, mealsIncluded: e.target.checked })}
              />
              <span className="text-sm font-medium">Meals</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.wifi}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, wifi: e.target.checked })}
              />
              <span className="text-sm font-medium">WiFi</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <input 
                type="checkbox" 
                checked={formData.ac}
                className="w-4 h-4 accent-primary" 
                onChange={(e) => setFormData({ ...formData, ac: e.target.checked })}
              />
              <span className="text-sm font-medium">AC</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
              <span className="text-sm font-medium text-gray-500">Utilities:</span>
              <select 
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer"
                onChange={(e) => setFormData({ ...formData, utilities: e.target.value as UtilitiesType })}
              >
                <option value="Yes">Included</option>
                <option value="No">No</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Seats Available
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
                <Calendar className="w-4 h-4 text-gray-400" /> Move-in Date
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

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Contact Person</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Name</label>
              <input
                required
                type="text"
                placeholder="Owner/Student Name"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder="+923001234567"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Description (Extra details)</label>
          <textarea
            rows={4}
            placeholder="Tell students about the flatmates, the area vibes, or any specific rules..."
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
              <span>Bhej rahe hain...</span>
            </>
          ) : (
            'Listing Daalo'
          )}
        </button>
      </form>
    </div>
  );
}

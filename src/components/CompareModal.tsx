import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Landmark, MapPin, BadgeCheck, Users, Bed, CreditCard, Wind, Wifi, Coffee, Car } from 'lucide-react';
import { Listing } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onContact: (listing: Listing) => void;
  lang: 'EN' | 'UR';
}

export default function CompareModal({ isOpen, onClose, listings, onContact, lang }: CompareModalProps) {
  if (!isOpen) return null;

  const t = {
    EN: {
      compareRooms: "Room Comparison Matrix",
      sub: "Compare standard and hidden fees side-by-side to make the best decision.",
      rent: "Monthly Rent",
      deposit: "Security Deposit",
      location: "Location / Area",
      type: "Room Type",
      gender: "Gender Restriction",
      meals: "Meals Covered",
      wifi: "High-Speed WiFi",
      ac: "Air Conditioning (AC)",
      furnished: "Furnished Status",
      bathroom: "Attached Bath",
      parking: "Parking Space",
      contact: "Get in Touch",
      verified: "Verified",
      notVerified: "Unverified",
      furnishedYes: "Fully Furnished",
      furnishedNo: "Unfurnished",
      bathYes: "Attached Bath",
      bathNo: "Shared Bath",
      parkingYes: "Available",
      parkingNo: "Street Parking",
      noRooms: "Please select rooms to compare",
      boys: "Boys Only",
      girls: "Girls Only",
      any: "Family / Any"
    },
    UR: {
      compareRooms: "Kamron Ka Muwazna (Compare Rooms)",
      sub: "Rent, deposit aur facilities side-by-side compare karen.",
      rent: "Mahana Rent",
      deposit: "Security Deposit",
      location: "Area / Location",
      type: "Kamray Ki Type",
      gender: "Gender Restriction",
      meals: "Khana Included?",
      wifi: "Internet (WiFi)",
      ac: "AC Option",
      furnished: "Furniture Status",
      bathroom: "Attached Bath",
      parking: "Parking Space",
      contact: "Rabta Karen",
      verified: "Verified",
      notVerified: "Unverified",
      furnishedYes: "Fully Furnished",
      furnishedNo: "Unfurnished",
      bathYes: "Attached Bath",
      bathNo: "Shared Bath",
      parkingYes: "Available",
      parkingNo: "Street Parking",
      noRooms: "Muwazna karne ke liye kamray select karen.",
      boys: "Sirf Larkay",
      girls: "Sirf Larkiyan",
      any: "Family / Any"
    }
  }[lang];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gradient-to-r from-primary/5 to-transparent">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-6 h-6 text-primary" />
                {t.compareRooms}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 mt-1">
                {t.sub}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Listing Rows Grid */}
          <div className="p-4 md:p-8 overflow-x-auto max-h-[70vh]">
            {listings.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-bold">{t.noRooms}</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-4 px-4 font-bold text-xs text-primary dark:text-emerald-400 uppercase tracking-widest w-1/4">Feature</th>
                    {listings.map((l) => (
                      <th key={l.id} className="py-4 px-4 w-1/4">
                        <div className="space-y-2">
                          {l.verified && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 dark:bg-emerald-400/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              {t.verified}
                            </span>
                          )}
                          <h4 className="font-extrabold text-sm text-gray-900 dark:text-white line-clamp-2">{l.title}</h4>
                          <p className="text-xs text-slate-500">{l.area}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Rent */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      {t.rent}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4">
                        <span className="font-black text-lg text-primary dark:text-emerald-400">Rs. {l.rent.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">/m</span>
                      </td>
                    ))}
                  </tr>

                  {/* Security Deposit */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-primary" />
                      {t.deposit}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4 font-bold text-gray-800 dark:text-white">
                        Rs. {l.securityDeposit.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* Accommodation type */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Bed className="w-4 h-4 text-amber-500" />
                      {t.type}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4 font-semibold text-gray-700 dark:text-slate-200">
                        {l.type}
                      </td>
                    ))}
                  </tr>

                  {/* Gender Restriction */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      {t.gender}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          l.gender === 'Boys' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                          l.gender === 'Girls' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                        }`}>
                          {l.gender === 'Boys' ? t.boys : l.gender === 'Girls' ? t.girls : t.any}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Meals */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-emerald-500" />
                      {t.meals}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4">
                        {l.mealsIncluded ? (
                          <span className="text-emerald-500 font-extrabold flex items-center gap-1 text-xs">
                            <Check className="w-4 h-4" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* WiFi */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-sky-500" />
                      {t.wifi}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4">
                        {l.wifi ? (
                          <span className="text-sky-500 font-extrabold flex items-center gap-1 text-xs">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* AC */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      {t.ac}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4">
                        {l.ac ? (
                          <span className="text-cyan-500 font-extrabold flex items-center gap-1 text-xs">
                            <Check className="w-4 h-4" /> Available
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Furnished */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Bed className="w-4 h-4 text-amber-600" />
                      {t.furnished}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4 font-semibold text-xs text-gray-700 dark:text-slate-300">
                        {l.furnished ? t.furnishedYes : t.furnishedNo}
                      </td>
                    ))}
                  </tr>

                  {/* Bath */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Bed className="w-4 h-4 text-purple-500" />
                      {t.bathroom}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4 font-semibold text-xs text-gray-700 dark:text-slate-300">
                        {l.attachedBath ? t.bathYes : t.bathNo}
                      </td>
                    ))}
                  </tr>

                  {/* Parking */}
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-500" />
                      {t.parking}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-4 px-4 font-semibold text-xs text-gray-700 dark:text-slate-300">
                        {l.parking ? t.parkingYes : t.parkingNo}
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="py-6 px-4"></td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-6 px-4">
                        <motion.button
                          onClick={() => {
                            onContact(l);
                            onClose();
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-primary text-white text-xs font-bold py-3 px-4 rounded-xl hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {t.contact}
                        </motion.button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

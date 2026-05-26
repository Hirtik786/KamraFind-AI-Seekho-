import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function LoginModal({ isOpen, onClose, onToast }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        onToast("Kamyabi se login ho gaye!", 'success');
        onClose();
      } else {
        await signUpWithEmail(email, password);
        setVerificationSent(true);
        onToast("Account ban gaya! Please email check karein verification ke liye.", 'success');
      }
    } catch (err: any) {
      console.error("Auth error detail:", err);
      let msg = "Aik masla hua. Please data check karein.";
      if (err.code === 'auth/user-not-found') msg = "Is email se koi account nahi mila.";
      if (err.code === 'auth/wrong-password') msg = "Ghalat password.";
      if (err.code === 'auth/email-already-in-use') msg = "Ye email pehle se use mein hai.";
      if (err.code === 'auth/weak-password') msg = "Password kam az kam 6 characters ka hona chahiye.";
      if (err.code === 'auth/operation-not-allowed') msg = "Email/Password login disable hai Firebase Console mein. Please enable karein.";
      if (err.code === 'auth/invalid-email') msg = "Email ka format sahi nahi hai.";
      if (err.code === 'auth/invalid-login-credentials') msg = "Email ya password ghalat hai.";
      if (err.code === 'auth/too-many-requests') msg = "Bohat zyada koshishein. Please thori der baad try karein.";
      setError(msg);
      onToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      onToast("Google se login kamyab raha!", 'success');
      onClose();
    } catch (err) {
      // Handled in firebase helper
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {isLogin ? 'Khush Amdeed!' : 'Naya Account'}
            </h2>
            <p className="text-gray-500 mt-2 font-medium">
              {isLogin ? 'Apne account mein login karein' : 'KamraFind join karein'}
            </p>
          </div>

          {verificationSent ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Email Verification Bhej Di Gai!</h3>
              <p className="text-gray-600">
                Humne aapki email <b>{email}</b> par aik link bheja hai. Please us par click karke apna account verify karein phir login karein.
              </p>
              <button 
                onClick={() => {
                  setIsLogin(true);
                  setVerificationSent(false);
                  setEmail('');
                  setPassword('');
                }}
                className="mt-6 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all"
              >
                Ab Login Karein
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-12 py-4 text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-12 py-4 text-sm font-semibold focus:bg-white focus:border-primary/20 outline-none transition-all"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs font-bold border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      {isLogin ? 'Login' : 'Signup'}
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Ya Phir</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-gray-700"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                Google se Login
              </button>

              <p className="text-center mt-8 text-sm font-medium text-gray-500">
                {isLogin ? 'Account nahi hai?' : 'Pehle se account hai?'}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-primary font-bold hover:underline"
                >
                  {isLogin ? 'Signup Karein' : 'Login Karein'}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Linkedin, Github, Send, Instagram, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface ContactTabProps {
  lang: 'EN' | 'UR';
}

export default function ContactTab({ lang }: ContactTabProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const t = {
    EN: {
      getInTouch: "Get in Touch",
      getInTouchSub: "If you have any questions or would like to speak with us, here are the ways to contact us:",
      meetDeveloper: "Meet the Developer",
      developerBio: "Hello! I am Hirtik Kumar, and I built this platform to bring simplicity and ease to your university housing search.",
      primaryEmail: "Email",
      whatsAppPhone: "WhatsApp / Call",
      location: "Location",
      locationVal: "Karachi, Pakistan",
      messageSentSuccess: "Thank You!",
      messageSentSuccessSub: "Your message has been received properly. I will connect with you soon.",
      sendAnotherMsg: "Send another message",
      messageFormTitle: "Write a Message",
      messageFormSub: "I will get back to you as soon as possible.",
      yourName: "Your Name",
      placeholderName: "Name",
      emailAddress: "Email Address",
      placeholderEmail: "email@example.com",
      message: "Message",
      placeholderMsg: "What would you like to say?",
      btnSending: "SENDING...",
      btnSend: "SAY HELLO!",
      builtWithPassion: "Built with Passion by Hirtik Kumar",
      genericError: "Something went wrong sending your message. Please try again."
    },
    UR: {
      getInTouch: "Rabta Karein",
      getInTouchSub: "Agar aapka koi sawaal hai ya aap hum se baat karna chahte hain, toh ye zaraaye hain:",
      meetDeveloper: "Developer Se Milain",
      developerBio: "Asalam-o-Alaikum! Main Hirtik Kumar hoon, aur ye platform maine aapki sahoolat ke liye banaya hai.",
      primaryEmail: "Email",
      whatsAppPhone: "WhatsApp / Call",
      location: "Location",
      locationVal: "Karachi, Pakistan",
      messageSentSuccess: "Shukriya!",
      messageSentSuccessSub: "Aapka message mil gaya hai. Main jald rabta karoon ga.",
      sendAnotherMsg: "Ek aur message bhejein",
      messageFormTitle: "Message Bhejain",
      messageFormSub: "Main jald hi aapse rabta karoon ga.",
      yourName: "Aapka Naam",
      placeholderName: "Name",
      emailAddress: "Email Address",
      placeholderEmail: "email@example.com",
      message: "Message",
      placeholderMsg: "Aap kya kehna chahte hain?",
      btnSending: "BHEJ RAHE HAIN...",
      btnSend: "SAY HELLO!",
      builtWithPassion: "Built with Passion by Hirtik Kumar",
      genericError: "Kuch masla hua message bhejne mein. Dobara koshish karein."
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSending(true);
    try {
      // 1. Save to Firestore (Existing)
      await addDoc(collection(db, 'contact_messages'), {
        name,
        email,
        message,
        createdAt: serverTimestamp(),
      });

      // 2. Trigger Email Notification via Backend
      await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error("Contact send error:", err);
      alert(t.genericError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="text-center space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black text-gray-900 tracking-tight"
        >
          {t.getInTouch} <span className="text-primary text-xl">.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 font-medium text-lg max-w-xl mx-auto"
        >
          {t.getInTouchSub}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-primary/5 space-y-8"
        >
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900">{t.meetDeveloper}</h3>
            <p className="text-gray-500 font-medium italic">"{t.developerBio}"</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t.primaryEmail}</p>
                <a href="mailto:karwahirtik@gmail.com" className="text-sm font-bold text-gray-700 hover:text-primary transition-colors">karwahirtik@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t.whatsAppPhone}</p>
                <p className="text-sm font-bold text-gray-700">+92 (330) 3141088</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t.location}</p>
                <p className="text-sm font-bold text-gray-700">{t.locationVal}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <a href="https://www.linkedin.com/in/iamhirtikkumar/" className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com/Hirtik786" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary p-8 rounded-[3rem] shadow-2xl shadow-primary/20 text-white space-y-6"
        >
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black">{t.messageSentSuccess}</h3>
              <p className="text-white/70 font-medium italic">{t.messageSentSuccessSub}</p>
              <button 
                onClick={() => setSent(false)}
                className="mt-4 text-[10px] font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-emerald-500 hover:bg-white cursor-pointer transition-all"
              >
                {t.sendAnotherMsg}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h3 className="text-2xl font-black">{t.messageFormTitle}</h3>
                <p className="text-white/70 text-sm">{t.messageFormSub}</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.yourName}</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.placeholderName} 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 placeholder:text-white/30 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.emailAddress}</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.placeholderEmail} 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 placeholder:text-white/30 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.message}</label>
                  <textarea 
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.placeholderMsg} 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 placeholder:text-white/30 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none"
                  />
                </div>

                <button 
                  disabled={sending}
                  className="w-full bg-white text-primary rounded-2xl py-4 font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 shadow-xl disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-5 h-5 ${sending ? 'animate-bounce' : ''}`} />
                  {sending ? t.btnSending : t.btnSend}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>

      {/* Fun Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center pt-8"
      >
        <p className="text-gray-300 font-black uppercase tracking-[0.2em] text-[10px]">{t.builtWithPassion}</p>
      </motion.div>
    </div>
  );
}

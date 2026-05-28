import { useState, useRef, useEffect } from 'react';
import { Listing, ChatMessage } from '../types';
import { SYSTEM_PROMPT } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, MapPin, School, Banknote, AlertCircle, Trash2, X, Languages } from 'lucide-react';

interface AIAssistantTabProps {
  listings: Listing[];
  contextListing: Listing | null;
  onClearContext: () => void;
  onClose?: () => void;
  lang?: 'EN' | 'UR';
}

export default function AIAssistantTab({ listings, contextListing, onClearContext, onClose, lang = 'EN' }: AIAssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedListings, setSuggestedListings] = useState<Listing[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Maintain precise chat language preferences: 'english', 'roman-urdu', or 'urdu' (script)
  const [chatLang, setChatLang] = useState<'english' | 'roman-urdu' | 'urdu'>(() => {
    const saved = localStorage.getItem('kamraFind_chatLang');
    if (saved === 'english' || saved === 'roman-urdu' || saved === 'urdu') return saved;
    return lang === 'UR' ? 'urdu' : 'roman-urdu';
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Synchronize initial greeting based on selected chat language preference if no custom chat messages exist
  useEffect(() => {
    if (messages.length <= 1) { // allow resetting greeting
      if (contextListing) {
        let content = '';
        if (chatLang === 'english') {
          content = `Hello! I noticed you are interested in this listing: "${contextListing.title}". Would you like to ask something about it or should I search for similar options?`;
        } else if (chatLang === 'urdu') {
          content = `السلام علیکم! مجھے معلوم ہوا کہ آپ کو یہ رہائش پسند آئی ہے: "${contextListing.title}"۔ کیا آپ اس کے بارے میں کچھ پوچھنا چاہتے ہیں یا میں آپ کے لیے اسی طرح کی دوسری جگہیں تلاش کروں؟`;
        } else {
          content = `Assalam-o-Alaikum! Mujhe pata chala ke aapko ye listing pasand aayi hai: "${contextListing.title}". Is ke baare mein kuch poochna chahte hain ya main milti julti aur jagah dhondhu?`;
        }
        setMessages([{ role: 'assistant', content }]);
      } else {
        let content = '';
        if (chatLang === 'english') {
          content = "Hello! I am KamraFind Assistant. I will help you find compatible room partners and student accommodations in Karachi. Which university do you study at and what is your budget?";
        } else if (chatLang === 'urdu') {
          content = "السلام علیکم! میں کمرا فائنڈ اسسٹنٹ ہوں۔ کراچی میں طلبہ کے لیے بہترین رہائش تلاش کرنے میں میں آپ کی پوری مدد کروں گا۔ آپ کس یونیورسٹی میں پڑھتے ہیں اور آپ کا بجٹ کتنا ہے؟";
        } else {
          content = "Assalam-o-Alaikum! Main KamraFind Assistant hoon. Karachi mein student accommodation dhoondne mein main aapki poori madad karunga. Aap kaunsi university mein padhte hain aur aapka budget kiya hai?";
        }
        setMessages([{ role: 'assistant', content }]);
      }
    }
  }, [contextListing, chatLang]);

  // Save selection instantly to local storage
  const handleChatLangChange = (newLang: 'english' | 'roman-urdu' | 'urdu') => {
    setChatLang(newLang);
    localStorage.setItem('kamraFind_chatLang', newLang);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    const initialHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare a temporary empty bot message that will be populated as chunks stream in
    const botMsgIndex = initialHistory.length + 1;
    let streamText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: initialHistory,
          input,
          listings,
          contextListing,
          chatLang
        }),
      });

      if (!response.ok) {
        throw new Error('Network response got interrupted');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Readable stream not supported on this browser');
      }

      // Add placeholder bot message block
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        // SSE parses data sequences
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                streamText += `\n[Error: ${parsed.error}]`;
              } else if (parsed.text) {
                streamText += parsed.text;
              }
              
              // Extract FILTERS_JSON if present inside stream text
              let displayContent = streamText;
              let matchedListings: Listing[] = [];

              if (streamText.includes('FILTERS_JSON:')) {
                const parts = streamText.split('FILTERS_JSON:');
                displayContent = parts[0].trim();
                try {
                  const jsonStr = parts[1].trim();
                  // Try parsing if complete JSON
                  if (jsonStr.endsWith('}')) {
                    const filters = JSON.parse(jsonStr);
                    matchedListings = listings.filter(l => {
                      let matches = true;
                      if (filters.maxBudget && l.rent > filters.maxBudget) matches = false;
                      if (filters.gender && filters.gender !== 'Any' && l.gender !== filters.gender) matches = false;
                      if (filters.university && filters.university !== 'Any' && !l.university.toLowerCase().includes(filters.university.toLowerCase())) matches = false;
                      if (filters.area && filters.area !== 'Any' && !l.area.toLowerCase().includes(filters.area.toLowerCase())) matches = false;
                      return matches;
                    }).slice(0, 3);
                  }
                } catch {
                  // Incomplete JSON segment during stream - skip until fully resolved
                }
              }

              setMessages(prev => {
                const copy = [...prev];
                if (copy[botMsgIndex]) {
                  copy[botMsgIndex] = {
                    role: 'assistant',
                    content: displayContent,
                    listings: matchedListings.length > 0 ? matchedListings : undefined
                  };
                }
                return copy;
              });

              if (matchedListings.length > 0) {
                setSuggestedListings(matchedListings);
              }
            } catch (err) {
              console.warn('Chunk processing anomaly', err);
            }
          }
        }
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => {
        // If we added a placeholder, replace it with failure notice. Otherwise, append a new block.
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
          copy[copy.length - 1] = {
            role: 'assistant',
            content: "Maaf kijiyega, server se communicate karne mein thora masla ho raha hai. Please internet connection check karein ya dobara koshish karein."
          };
          return copy;
        }
        return [...prev, { role: 'assistant', content: "Maaf kijiyega, server se communicate karne mein thora masla ho raha hai. Please internet connection check karein ya dobara koshish karein." }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    let content = '';
    if (chatLang === 'english') {
      content = "Hello! Let's start a new search. Which university do you study at and what is your budget?";
    } else if (chatLang === 'urdu') {
      content = "السلام علیکم! نیا سرچ شروع کرتے ہیں۔ آپ کس یونیورسٹی میں پڑھتے ہیں اور آپ کا بجٹ کتنا ہے؟";
    } else {
      content = "Assalam-o-Alaikum! Naya search shuru karte hain. Aap kaunsi university mein padhte hain aur aapka budget kiya hai?";
    }
    setMessages([{ role: 'assistant', content }]);
    setSuggestedListings([]);
    onClearContext();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* AI Header */}
      <div className="p-4 bg-primary text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">KamraFind AI</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white mt-1"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white mt-1"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Chat Language Settings Switcher Bar */}
      <div className="bg-slate-100/50 dark:bg-slate-900 border-b border-gray-200/55 dark:border-slate-800 p-2 md:p-3 flex items-center justify-between gap-1 shrink-0">
        <span className="text-[9.5px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 flex items-center gap-1 ml-1 select-none">
          <Languages className="w-3.5 h-3.5 text-primary dark:text-teal-400" /> Chat Mode:
        </span>
        <div className="flex bg-gray-200/50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200/10 shadow-inner">
          <button
            onClick={() => handleChatLangChange('english')}
            className={`px-3.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
              chatLang === 'english'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-teal-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 dark:hover:text-slate-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleChatLangChange('roman-urdu')}
            className={`px-3.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
              chatLang === 'roman-urdu'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-teal-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 dark:hover:text-slate-300'
            }`}
          >
            Roman Urdu
          </button>
          <button
            onClick={() => handleChatLangChange('urdu')}
            className={`px-3.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
              chatLang === 'urdu'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-teal-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-850 dark:hover:text-slate-300'
            }`}
          >
            اردو (Urdu)
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: m.role === 'user' ? 5 : -5 }}
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                    m.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-indigo-500 to-primary text-white border border-primary/10'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </motion.div>
                <div className="space-y-3">
                  <motion.div 
                    layoutId={`msg-bubble-${idx}`}
                    className={`px-4 py-3 rounded-2xl shadow-xs transition-colors ${
                      m.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-gray-100/30'
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${m.role === 'assistant' ? 'whitespace-pre-wrap' : ''}`}>
                      {m.content}
                    </p>
                  </motion.div>
 
                  {/* Inline Suggested Listings with premium staggered motion */}
                  {m.listings && m.listings.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2.5 pt-2"
                    >
                      <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> recommended accommodations
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {m.listings.map((l, lIdx) => (
                          <motion.div 
                            key={l.id} 
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: lIdx * 0.1, type: 'spring', damping: 15 }}
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-emerald-400 hover:shadow-md transition-all duration-300"
                          >
                            <div className="w-11 h-11 bg-primary/5 rounded-xl shrink-0 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-xs truncate text-gray-900">{l.title}</h4>
                              <p className="text-[10px] text-gray-400 font-bold truncate">{l.area} · {l.university}</p>
                              <p className="text-xs font-black text-primary font-mono">Rs. {l.rent.toLocaleString()}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
 
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-primary text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-white px-4 py-3.5 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                  <span className="w-2 h-2 bg-primary/75 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.18s]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.36s]"></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Advice Overlay */}
      <div className="px-4 py-2 bg-accent/5 border-t border-accent/10">
        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-800 uppercase tracking-widest overflow-hidden whitespace-nowrap">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <marquee scrollamount="3">Advance dene se pehle ghar zaroor dekho! Ask about hidden charges: Gas, Pani, Security.</marquee>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message in Roman Urdu..."
            className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:brightness-105 disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

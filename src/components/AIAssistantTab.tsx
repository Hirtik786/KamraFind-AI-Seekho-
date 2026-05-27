import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Listing, ChatMessage } from '../types';
import { SYSTEM_PROMPT } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, MapPin, School, Banknote, AlertCircle, Trash2, X } from 'lucide-react';

interface AIAssistantTabProps {
  listings: Listing[];
  contextListing: Listing | null;
  onClearContext: () => void;
  onClose?: () => void;
}

export default function AIAssistantTab({ listings, contextListing, onClearContext, onClose }: AIAssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedListings, setSuggestedListings] = useState<Listing[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0) {
      if (contextListing) {
        setMessages([
          { role: 'assistant', content: `Assalam-o-Alaikum! Mujhe pata chala ke aapko ye listing pasand aayi hai: "${contextListing.title}". Is ke baare mein kuch poochna chahte hain ya main milti julti aur jagah dhondhu?` }
        ]);
      } else {
        setMessages([
          { role: 'assistant', content: "Assalam-o-Alaikum! Main KamraFind Assistant hoon. Karachi mein student accommodation dhoondne mein main aapki poori madad karunga. Aap kaunsi university mein padhte hain aur aapka budget kiya hai?" }
        ]);
      }
    }
  }, [contextListing]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Add listings data to prompt
      const contextPrompt = `
Current listings data: ${JSON.stringify(listings.map(l => ({ 
  id: l.id, title: l.title, rent: l.rent, area: l.area, university: l.university, type: l.type, gender: l.gender, meals: l.mealsIncluded 
})))}

${contextListing ? `Special context: Student is currently looking at this listing: ${JSON.stringify(contextListing)}` : ''}

Student message: ${input}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
        contents: [...history.map(h => ({ role: h.role as any, parts: h.parts })), { role: 'user', parts: [{ text: contextPrompt }] }],
      });

      const responseText = response.text || '';

      // Extract JSON if present
      let finalContent = responseText;
      let matchedListings: Listing[] = [];

      if (responseText.includes('FILTERS_JSON:')) {
        try {
          const jsonStr = responseText.split('FILTERS_JSON:')[1].trim();
          const filters = JSON.parse(jsonStr);
          finalContent = responseText.split('FILTERS_JSON:')[0].trim();

          // Apply filters found by AI
          matchedListings = listings.filter(l => {
            let matches = true;
            if (filters.maxBudget && l.rent > filters.maxBudget) matches = false;
            if (filters.gender && filters.gender !== 'Any' && l.gender !== filters.gender) matches = false;
            if (filters.university && filters.university !== 'Any' && !l.university.toLowerCase().includes(filters.university.toLowerCase())) matches = false;
            if (filters.area && filters.area !== 'Any' && !l.area.toLowerCase().includes(filters.area.toLowerCase())) matches = false;
            return matches;
          }).slice(0, 3); // Top 3
        } catch (e) {
          console.error("Failed to parse AI filters", e);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalContent, listings: matchedListings }]);
      if (matchedListings.length > 0) {
        setSuggestedListings(matchedListings);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Maaf kijiyega, Gemini se connect karne mein thora masla ho raha hai. Please internet check karein ya thori der baad koshish karein." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Assalam-o-Alaikum! Naya search shuru karte hain. Aap kaunsi university mein padhte hain?" }]);
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                  m.role === 'user' ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/10'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-3">
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className={`text-sm leading-relaxed ${m.role === 'assistant' ? 'whitespace-pre-wrap' : ''}`}>
                      {m.content}
                    </p>
                  </div>

                  {/* Inline Suggested Listings */}
                  {m.listings && m.listings.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent" /> Recommended for you
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {m.listings.map((l) => (
                          <div key={l.id} className="bg-white p-3 rounded-xl border border-primary/5 shadow-sm flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate">{l.title}</h4>
                              <p className="text-[10px] text-gray-500 truncate">{l.area} · {l.university}</p>
                              <p className="text-xs font-bold text-primary">Rs. {l.rent.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-white text-primary border border-primary/10 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]"></span>
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

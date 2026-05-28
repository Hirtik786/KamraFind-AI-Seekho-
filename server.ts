import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for secure, fast-responsive streaming chatbot interaction
  app.post('/api/chat', async (req, res) => {
    const { history = [], input = '', listings = [], contextListing = null, chatLang = 'roman-urdu' } = req.body;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not configured. Please add it to your Secrets.' })}\n\n`);
        return res.end();
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const formattedListings = listings.map((l: any) => ({
        id: l.id,
        title: l.title,
        rent: l.rent,
        area: l.area,
        university: l.university,
        type: l.type,
        gender: l.gender,
        meals: l.mealsIncluded
      }));

      const contextPrompt = `
Current listings data: ${JSON.stringify(formattedListings)}
${contextListing ? `Special context: Student is currently looking at this listing: ${JSON.stringify(contextListing)}` : ''}

Student message: ${input}
`;

      let languagePreferenceDirective = '';
      if (chatLang === 'english') {
        languagePreferenceDirective = 'You MUST reply ONLY in English. Do not write in Roman Urdu or Urdu script.';
      } else if (chatLang === 'urdu') {
        languagePreferenceDirective = 'You MUST reply ONLY in respectful Urdu script (e.g. السلام علیکم! میں آپ کی مدد کے لیے حاضر ہوں). Do not write in Roman scripts or pure English except for proper nouns.';
      } else {
        languagePreferenceDirective = 'You MUST reply ONLY in Roman Urdu (Urdu written with English letters, e.g. "Aap kaise hain?"). Do not use Urdu script alphabets or pure English unless responding to specific English queries.';
      }

      const systemInstruction = `You are KamraFind Assistant, a helpful room-finding guide for university students in Karachi, Pakistan.

Your personality: friendly, helpful, honest, big-brother style. Keep your words highly relevant, practical, and extremely fast.

Language Guidelines:
${languagePreferenceDirective}

Your job:
1. Ask smart questions to understand what the student needs.
2. Recommend the best matching listings from the current listings data. Include the rental price, area, and close proximity to academic hub.
3. Suggest a couple of crucial questions to ask before paying or renting (e.g. "Water availability?", "Electrical meters?").
4. Warn about advance scams.

After your pleasant message, if matching listings are identified, append exactly:
FILTERS_JSON:
{"type": "Hostel"|"Sharing Flat"|"Single Room"|"Full Apartment"|"Any", "area": "Gulshan-e-Iqbal"|"PECHS"|...|"Any", "maxBudget": number, "university": "NED"|"IBA"|...|"Any", "gender": "Boys"|"Girls"|"Any", "meals": boolean}`;

      const contents = [
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content || '' }]
        })),
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        }
      ];

      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
    } catch (err: any) {
      console.error('Gemini stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err?.message || 'Server error occurred relative to Gemini generation stream.' })}\n\n`);
    } finally {
      res.end();
    }
  });

  // API Route for sending contact emails
  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Sare fields bharna zaroori hain.' });
    }

    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY missing - skipping actual email send');
        return res.json({ success: true, warning: 'API Key missing but request logged locally.' });
      }

      await resend.emails.send({
        from: 'Dhondho App <onboarding@resend.dev>',
        to: 'karwahirtik@gmail.com',
        subject: `Naya Message: ${name} se`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Dhondho Contact Form</h2>
            <p><strong>Naam:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
              ${message}
            </div>
            <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #9ca3af;">Ye email Dhondho App se bheja gaya hai.</p>
          </div>
        `,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ error: 'Email bhejne mein masla hua.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

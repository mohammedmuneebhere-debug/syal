import React from 'react';
import { UserProfile } from './types';

export const getSystemInstruction = (user: UserProfile | null) => `
You are Alowish, a smart, friendly, and conversational AI personal assistant.
Your wake word is “Hey Alowish”.

${user ? `
👤 **USER CONTEXT (IMPORTANT)**
You are speaking to **${user.name}**.
- **Profession/Work**: ${user.work} (Tailor your analogies and advice to this field).
- **Interests/Hobbies**: ${user.hobbies} (Reference these when making small talk or suggestions).
- **Emergency Contacts**: ${user.emergencyContacts.length > 0 ? user.emergencyContacts.map(c => c.name).join(', ') : 'None set'}.
` : ''}

You combine the personality of Siri / Bixby / Gemini with the conversational intelligence of ChatGPT / Copilot.

🛡️ **SAFETY & EMERGENCY (HIGHEST PRIORITY)**
- If the user says "Help", "SOS", "Save me", "I'm in danger", "Emergency", or "Bachao" (Hindi):
  - **IMMEDIATELY** call the \`triggerSOS\` tool.
  - Do not ask for confirmation. Act instantly.
  - Be supportive and calm in your response *after* triggering the tool.

🗣️ Language & Tone
- Understand and respond in English and Hinglish (Hindi + English).
- **Hinglish Style**: Use Roman script for Hindi words. Code-switch naturally like a bilingual Indian speaker.
  - Example: "Weather toh kaafi acha hai aaj, maybe ek walk pe jaana chahiye."
  - Do NOT use Devanagari script (e.g., नमस्ते) unless explicitly asked.
- Automatically adapt to the user’s language style.
- Keep responses short, natural, expressive, and human-like.
- Use light emojis when suitable (🔦🎶📸).
- Personality: helpful, witty, polite, calm, and friendly.

🇮🇳 Indian User Context (Strict)
- **Currency**: Always use **Indian Rupee (₹)** for prices or money.
- **Numbers**: Use the Indian Numbering System (**Lakhs, Crores**) instead of Millions/Billions.
  - Example: "1.5 Lakh" instead of "150k", "2 Crore" instead of "20 Million".
- **Units**: Use the **Metric System** (Celsius, Kilometers, Kilograms).
- **Date Format**: **DD/MM/YYYY** (e.g., 25/01/2024).

🧠 Conversational Intelligence
- Support casual chatting and friendly conversations.
- Handle multi-turn context naturally.
- Ask follow-up questions when needed.
- Maintain continuity.
- Respond socially when no task is given. Example: “Samajh gaya 😄 Batao, main kya help karoon?”

🌐 Knowledge & Search
- Use the **Google Search** tool for queries about current events, real-time facts, news, weather, or specific topics where up-to-date information is needed.
- When you use Search, the system will automatically show references. You do not need to manually type the URL in the text response, but you should synthesize the information found.

⚙️ Ability Awareness (IMPORTANT)
Alowish must always be aware of whether the task requires ONLINE or OFFLINE access.
The system will provide tools to perform actions. If a tool is available, use it.

✅ Action Confirmation Rule
Always confirm before executing any action (calling a function).
Examples:
“Sure, turning on the flashlight now 🔦.”
“Bilkul, call laga raha hoon 📞.”

🔐 Privacy & Safety
Never access or share personal data without permission.
Identity Reminder
Name: Alowish
`;

// Icons
export const MicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

export const SendIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

export const FlashlightIcon = ({ className, on }: { className?: string, on?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={on ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

export const MusicIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-2.874-1.715V15.95M18 12v-.003m0 5.862v.003M9 17.25v1.006a2.25 2.25 0 01-1.632 2.162L6.048 20.8a1.802 1.802 0 11-2.874-1.714V14.25m3.226-5.06L17.226 5.94A2.249 2.249 0 0119.5 5.94v5.06a2.25 2.25 0 01-1.632 2.163l-1.32.376a1.803 1.803 0 01-2.874-1.714V7.5" />
  </svg>
);

export const WifiIcon = ({ className, on }: { className?: string, on?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={on ? "#10b981" : "currentColor"} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h4.875a2.625 2.625 0 010 5.25H12M8.25 9.75L10.5 7.5M8.25 9.75L10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.5c.475-.114.966-.172 1.457-.172h6c.49 0 .982.058 1.457.172.96.229 1.635 1.054 1.907 2.185z" /> 
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.895 8.75a5.975 5.975 0 00-4.79 0m-2.13-2.13a9.006 9.006 0 0111.05 0m-8.92 8.92a2.25 2.25 0 113.18 0" />
  </svg>
);

export const BluetoothIcon = ({ className, on }: { className?: string, on?: boolean }) => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={on ? "#3b82f6" : "currentColor"} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5l7.5-6v15l-7.5-6L15 10.5" />
   </svg>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const XMarkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const EarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

export const CameraIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

export const ImageIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const LinkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

export const SOSIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const SyalLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="4" className={className}>
    <line x1="70" y1="30" x2="70" y2="10" strokeLinecap="round" />
    <circle cx="70" cy="10" r="6" />
    <rect x="25" y="30" width="90" height="80" rx="25" />
    <circle cx="50" cy="60" r="8" />
    <circle cx="90" cy="60" r="8" />
    <rect x="50" y="85" width="40" height="10" rx="5" />
  </svg>
);
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sender, Message, AppState, Theme, VoiceAccent, UserProfile, EmergencyContact } from './types';
import { sendMessageToGemini, startChatSession } from './services/geminiService';
import { processOfflineMessage } from './services/offlineService';
import { MicIcon, SendIcon, FlashlightIcon, MusicIcon, WifiIcon, BluetoothIcon, SettingsIcon, XMarkIcon, EarIcon, CameraIcon, ImageIcon, LinkIcon, SOSIcon, SyalLogo } from './constants';

const THEMES = {
  blue: {
    bg: 'bg-slate-900',
    header: 'bg-slate-900/80',
    userBubble: 'bg-blue-600',
    botBubble: 'bg-slate-800',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-600',
    ring: 'focus:ring-blue-500/50',
    gradient: 'from-indigo-900/30'
  },
  pink: {
    bg: 'bg-slate-900',
    header: 'bg-slate-900/80',
    userBubble: 'bg-pink-600',
    botBubble: 'bg-slate-800',
    accent: 'text-pink-400',
    accentBg: 'bg-pink-600',
    ring: 'focus:ring-pink-500/50',
    gradient: 'from-pink-900/30'
  },
  dark: {
    bg: 'bg-black',
    header: 'bg-black/80',
    userBubble: 'bg-gray-700',
    botBubble: 'bg-neutral-900',
    accent: 'text-gray-200',
    accentBg: 'bg-gray-700',
    ring: 'focus:ring-gray-500/50',
    gradient: 'from-gray-800/30'
  }
};

// Comprehensive list of wake word variations
const RAW_WAKE_WORDS = [
  'hey alowish', 'hey allowish', 'hey aloish', 'hi alowish', 'hello alowish', 
  'hey alovish', 'hey alwish', 'hey alvish',
  // STT Misinterpretations
  'hey alice', 'hey al', 'hey wish', 'hey a lowish', 'hey aloysius', 
  'hey alvis', 'hey elvish', 'hey yellowish', 'hey lowish',
  'hey louis', 'hey lewis', 'hey all wish', 'hey a wish', 'hello wish',
  'hey allo wish', 'hey aloe wish', 'hey love wish', 
  'hey lavish', 'hey lowis', 'hey loish', 'hey alois',
  'hey all of us', 'hey olive wish', 'hey early wish',
  'hey a list', 'hey at least', 'hey i wish', 'hey high wish',
  'hey allow wish', 'hey elvis', 'hallo wish', 'hallo alowish',
  'hey always', 'hey all ways', 'hey allo is', 'hey aloo is',
  'hey eloise', 'hey elouise', 'hey alloy wish', 'hey alloy ish',
  'hey a law wish', 'hey ala wish', 'hey ola wish', 'hey hola wish',
  'hey allow is', 'hey aloe is', 'hey hello is',
  'hey i love wish', 'hey all his', 'hey all this', 
  'hey a lavish', 'hey a love wish', 'hey low ish',
  'hey allah wish', 'hey all of his', 'hey a loish',
  'hey allow us', 'hey aloe us', 'hey owl wish', 'hey owl ish',
  'hey i\'ll wish', 'hey ill wish', 'hey el wish',
  // Hinglish
  'hey aalo wish', 'hey alu wish', 'hey elo wish', 'hey hello wish',
  'hey aalu wish', 'hey aaloo wish', 'hey alu vish', 'hey aalu vish',
  'hey yellow wish', 'hey hallow wish', 'hey halo wish', 'hey hollow wish',
  'hey all of which', 'hey all of wish', 'hey a lo wish', 'hey a low wish',
  'hey aloo vish', 'hey aloo wish', 'hey aaloo vish', 'hey elo vish',
  'hey allow vish', 'hey allo vish', 'hey hello vish', 
  'hey al vish', 'hey all vish', 'hey oil wish', 'hey oil vish',
  // Casual
  'oye alowish', 'ok alowish', 'okay alowish', 'arey alowish', 'sun alowish', 'suno alowish', 
  'listen alowish', 'haan alowish', 'ha alowish', 'abey alowish', 'arre alowish',
  'hello ji alowish', 'namaste alowish', 'hi ji alowish', 'alright alowish'
];
const WAKE_WORDS = RAW_WAKE_WORDS.sort((a, b) => b.length - a.length);

const removeEmojis = (str: string) => {
  return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

const App: React.FC = () => {
  // --- Auth & User State ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState<'login' | 'profile'>('login');
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [work, setWork] = useState('');
  const [hobbies, setHobbies] = useState('');

  // Settings: Emergency Contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');

  // --- App Core State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Settings State
  const [theme, setTheme] = useState<Theme>('blue');
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>('indian');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Simulated Device State
  const [deviceState, setDeviceState] = useState<AppState>({
    flashlight: false,
    musicPlaying: false,
    currentSong: 'Local MP3 Mix',
    wifi: true,
    bluetooth: true,
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isAiSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentTheme = THEMES[theme];

  // --- Init Effect ---
  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem('syal_user');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Ensure emergencyContacts array exists for legacy data
        if (!parsedUser.emergencyContacts) parsedUser.emergencyContacts = [];
        setUserProfile(parsedUser);
        setIsAuthenticated(true);
        startChatSession(parsedUser);
        setMessages([{
            id: 'welcome',
            text: `Hey ${parsedUser.name.split(' ')[0]}! I'm Alowish. How can I help you today? 😄`,
            sender: Sender.ALOWISH,
            timestamp: new Date(),
        }]);
    }
  }, []);

  // --- Effects ---

  // Network Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pre-load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hands Free Logic
  useEffect(() => {
    if (isHandsFree && !isListening && !isAiSpeakingRef.current && !isLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        startListening(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHandsFree, isListening, isLoading, isAuthenticated]);

  // Camera Logic
  useEffect(() => {
    if (showCamera) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.muted = true;
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
                setShowCamera(false);
                alert("Could not access camera.");
            });
    } else {
        // Stop stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [showCamera]);

  // --- Helper Functions ---

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
        setLoginStep('profile');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName && dob && work && hobbies) {
        const newUser: UserProfile = {
            email,
            name: fullName,
            dob,
            work,
            hobbies,
            emergencyContacts: []
        };
        localStorage.setItem('syal_user', JSON.stringify(newUser));
        setUserProfile(newUser);
        setIsAuthenticated(true);
        startChatSession(newUser); // Initialize AI with context
        setMessages([{
            id: 'welcome',
            text: `Welcome back, ${fullName.split(' ')[0]}! I've noted that you're interested in ${hobbies} and work in ${work}. How can I assist you?`,
            sender: Sender.ALOWISH,
            timestamp: new Date(),
        }]);
    }
  };

  const addEmergencyContact = () => {
      if (!newContactName || !newContactNumber) return;
      if (!userProfile) return;

      const newContact: EmergencyContact = {
          id: Date.now().toString(),
          name: newContactName,
          number: newContactNumber
      };

      const updatedProfile = {
          ...userProfile,
          emergencyContacts: [...userProfile.emergencyContacts, newContact]
      };
      
      setUserProfile(updatedProfile);
      localStorage.setItem('syal_user', JSON.stringify(updatedProfile));
      setNewContactName('');
      setNewContactNumber('');
  };

  const removeEmergencyContact = (id: string) => {
      if (!userProfile) return;
      const updatedProfile = {
          ...userProfile,
          emergencyContacts: userProfile.emergencyContacts.filter(c => c.id !== id)
      };
      setUserProfile(updatedProfile);
      localStorage.setItem('syal_user', JSON.stringify(updatedProfile));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setSelectedImage(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const checkWakeWord = (transcript: string): boolean => {
    const lower = transcript.toLowerCase();
    return WAKE_WORDS.some(w => lower.includes(w));
  };

  const stripWakeWord = (transcript: string): string => {
    let cleaned = transcript.toLowerCase();
    for (const w of WAKE_WORDS) {
      if (cleaned.includes(w)) {
        cleaned = cleaned.replace(w, '');
        return cleaned.trim();
      }
    }
    return transcript;
  };

  const speak = (text: string) => {
    // If it's SOS message, force speak even if disabled (safety override)
    const isSOS = text.includes("Emergency Alert");
    if (!isSpeechEnabled && !isSOS) {
      if (isHandsFree) isAiSpeakingRef.current = false;
      return;
    }
    const cleanText = removeEmojis(text);
    window.speechSynthesis.cancel();
    isAiSpeakingRef.current = true;
    if (recognitionRef.current) {
        recognitionRef.current.abort();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Voices Selection Logic (Same as previous)
    const getRegionVoices = (langCodes: string[], nameKeywords: string[]) => {
        return voices.filter(v => 
            langCodes.some(code => v.lang.toLowerCase().includes(code.toLowerCase())) || 
            nameKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
        );
    };

    const indianVoices = getRegionVoices(['en-IN', 'hi-IN'], ['India', 'Hindi']);
    const ukVoices = getRegionVoices(['en-GB'], ['UK', 'Great Britain', 'United Kingdom']);
    const usVoices = getRegionVoices(['en-US'], ['US', 'United States']);
    
    // Score voices - HEAVILY prioritize MALE voices
    const getVoiceScore = (voice: SpeechSynthesisVoice) => {
        let score = 0;
        const name = voice.name.toLowerCase();
        if (name.includes('google')) score += 5;
        if (name.includes('microsoft')) score += 4;
        if (name.includes('siri')) score += 3;
        if (name.includes('enhanced')) score += 2;
        if (name.includes('natural')) score += 2;
        if (name.includes('premium')) score += 2;

        const maleNames = ['male', 'david', 'james', 'alex', 'daniel', 'rishi', 'prabhat', 'hemant', 'george', 'fred', 'aaron', 'ben', 'mark'];
        const femaleNames = ['female', 'zira', 'samantha', 'victoria', 'hazel', 'susan', 'heera', 'priya', 'neerja', 'veena', 'sangeeta', 'karen', 'moira', 'tessa'];

        const isMale = maleNames.some(n => name.includes(n));
        const isFemale = femaleNames.some(n => name.includes(n));

        if (isMale) score += 50; 
        else if (isFemale) score -= 100; // Penalize female voices to avoid them

        return score;
    };

    let targetList: SpeechSynthesisVoice[] = [];
    switch (voiceAccent) {
        case 'uk': targetList = ukVoices; break;
        case 'us': targetList = usVoices; break;
        case 'indian': default: targetList = indianVoices; break;
    }

    let selectedVoice: SpeechSynthesisVoice | undefined;
    const getBestInList = (list: SpeechSynthesisVoice[]) => {
        if (list.length === 0) return null;
        return list.sort((a, b) => getVoiceScore(b) - getVoiceScore(a))[0];
    };

    const bestTargetVoice = getBestInList(targetList);

    // If the best target voice is actually male (score > 0 implies likely male or at least not strictly female)
    if (bestTargetVoice && getVoiceScore(bestTargetVoice) > -50) {
        selectedVoice = bestTargetVoice;
    } else {
        const fallbacks = [indianVoices, ukVoices, usVoices, voices];
        for (const list of fallbacks) {
            const bestFallback = getBestInList(list);
            if (bestFallback && getVoiceScore(bestFallback) > -50) {
                selectedVoice = bestFallback;
                break;
            }
        }
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        if (voiceAccent === 'indian') {
            utterance.rate = 1.1; utterance.pitch = 1.0; 
        } else if (voiceAccent === 'uk') {
            utterance.rate = 0.95; utterance.pitch = 1.05;
        } else { 
            utterance.rate = 1.0; utterance.pitch = 1.0; 
        }
    }

    utterance.onend = () => { isAiSpeakingRef.current = false; };
    utterance.onerror = () => { isAiSpeakingRef.current = false; };
    window.speechSynthesis.speak(utterance);
  };

  // --- SOS Logic ---
  const handleSOS = useCallback(() => {
    // 1. Audio Alert (Siren Effect simulation via Speech)
    speak("Emergency Alert! Sending Location to Emergency Contacts!");

    // 2. Get Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            // 3. Prepare Message
            const messageBody = `EMERGENCY! I need help. My current location is: ${mapsLink}. Sent via SYAL AI.`;
            
            // 4. Construct SMS Link
            // Note: 'sms:' protocol behaves differently on iOS vs Android regarding multiple recipients.
            // We'll target the first contact for the direct link, or just open app.
            let smsLink = 'sms:';
            if (userProfile && userProfile.emergencyContacts.length > 0) {
                 // Try to add multiple numbers
                 const numbers = userProfile.emergencyContacts.map(c => c.number).join(',');
                 // iOS uses '&', Android uses '?' usually, but modern devices differ. 
                 // Standard approach: sms:12345678?body=...
                 smsLink = `sms:${numbers}?body=${encodeURIComponent(messageBody)}`;
                 
                 // Also attempt to initiate a call to the first contact
                 setTimeout(() => {
                     window.open(`tel:${userProfile.emergencyContacts[0].number}`, '_self');
                 }, 3000); // 3 sec delay after SMS
            } else {
                smsLink = `sms:?body=${encodeURIComponent(messageBody)}`;
                alert("No emergency contacts set! Opening SMS app.");
            }

            // Open SMS App
            window.location.href = smsLink;

        }, (error) => {
            alert("Could not fetch location for SOS. Please enable GPS.");
            // Fallback SMS without location
            const messageBody = `EMERGENCY! I need help. Sent via SYAL AI (GPS Failed).`;
             if (userProfile && userProfile.emergencyContacts.length > 0) {
                 const numbers = userProfile.emergencyContacts.map(c => c.number).join(',');
                 window.location.href = `sms:${numbers}?body=${encodeURIComponent(messageBody)}`;
             }
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
  }, [userProfile]);

  // --- Handlers ---

  const executeTool = async (name: string, args: any) => {
    console.log("Executing Tool:", name, args);
    let result = "Done";

    if (name === 'toggleFlashlight') {
        setDeviceState(prev => ({ ...prev, flashlight: args.action === 'on' }));
        result = `Flashlight turned ${args.action}`;
    } else if (name === 'controlMusic') {
        if (args.action === 'play') {
            setDeviceState(prev => ({ ...prev, musicPlaying: true }));
            result = "Music playing";
        } else if (args.action === 'pause') {
            setDeviceState(prev => ({ ...prev, musicPlaying: false }));
            result = "Music paused";
        } else if (args.action === 'next') {
            setDeviceState(prev => ({ ...prev, currentSong: 'Next Song Track 02' }));
            result = "Skipped to next song";
        }
    } else if (name === 'makeCall') {
        window.open(`tel:${args.nameOrNumber}`, '_self');
        result = `Calling ${args.nameOrNumber}`;
    } else if (name === 'toggleConnectivity') {
        const target = args.type as 'wifi' | 'bluetooth';
        const val = args.action === 'on';
        setDeviceState(prev => ({ ...prev, [target]: val }));
        result = `${args.type} turned ${args.action}`;
    } else if (name === 'triggerSOS') {
        handleSOS();
        result = "SOS triggered. Location sent and contacts alerted.";
    }
    return result;
  };

  const processUserMessage = async (text: string, image?: string | null) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      image: image || undefined, // Store image in message history
      sender: Sender.USER,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let responseText = '';
      let groundingMetadata = undefined;

      if (isOnline) {
        // Pass image to Gemini Service
        const result = await sendMessageToGemini(userMsg.text, image || null, executeTool);
        if (result) {
            responseText = result.text || "I didn't get a response.";
            groundingMetadata = result.groundingMetadata;
        } else {
            responseText = "I didn't get a response.";
        }
      } else {
        if (image) {
             responseText = "I cannot process images while offline. Please connect to the internet.";
        } else {
            await new Promise(resolve => setTimeout(resolve, 600)); 
            const offlineRes = processOfflineMessage(userMsg.text);
            responseText = offlineRes.text;
            if (offlineRes.action) {
                const act = offlineRes.action;
                if (act.type === 'TOGGLE_FLASHLIGHT') setDeviceState(s => ({ ...s, flashlight: !!act.value }));
                if (act.type === 'PLAY_MUSIC') setDeviceState(s => ({ ...s, musicPlaying: true }));
                if (act.type === 'PAUSE_MUSIC') setDeviceState(s => ({ ...s, musicPlaying: false }));
                if (act.type === 'OPEN_CAMERA') setShowCamera(true);
                if (act.type === 'TRIGGER_SOS') handleSOS();
            }
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.ALOWISH,
        timestamp: new Date(),
        groundingMetadata: groundingMetadata
      };
      setMessages(prev => [...prev, aiMsg]);
      speak(responseText);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "Sorry, something went wrong. 😵",
        sender: Sender.ALOWISH,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      speak("Sorry, something went wrong.");
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleCapture = () => {
      const canvas = document.createElement("canvas");
      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      }
      setShowCamera(false);
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          const aiMsg: Message = {
              id: Date.now().toString(),
              text: "Extracted Text (Offline Simulation): \n'Product: Masala Chai Mix\nMRP: ₹245.00 (Incl. of all taxes)\nBest Before: 6 Months from Mfg.\nNet Qty: 250g'",
              sender: Sender.ALOWISH,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
          speak("Here is the text I extracted from the image.");
      }, 1500);
  };

  const handleSend = () => {
      if (inputText.trim() || selectedImage) {
          processUserMessage(inputText, selectedImage);
          setInputText('');
          setSelectedImage(null);
      }
  };

  const startListening = (continuousMode: boolean = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (!continuousMode) alert("Browser does not support Speech Recognition.");
      return;
    }
    if (isListening || isAiSpeakingRef.current) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN'; 
    recognition.interimResults = true;
    recognition.continuous = true; 
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const currentTranscript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      
      setInputText(currentTranscript);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(() => {
          recognition.stop(); 
          if (!currentTranscript.trim()) return;
          if (continuousMode) { 
             if (checkWakeWord(currentTranscript)) {
                const clean = stripWakeWord(currentTranscript);
                if (clean.length > 0) processUserMessage(clean);
                else speak("I'm listening.");
             }
          } else {
              processUserMessage(currentTranscript);
          }
      }, 2000);
    };

    recognition.onerror = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };
    try { recognition.start(); } catch (e) { setIsListening(false); }
  };

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    } else {
      startListening(false); 
    }
  };

  // --- Render ---

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
        <div className={`flex min-h-screen w-full ${currentTheme.bg} text-slate-200 items-center justify-center p-6 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-2/3 bg-gradient-to-b ${currentTheme.gradient} to-transparent pointer-events-none`}></div>
            
            <div className="max-w-md w-full relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <SyalLogo className={`w-24 h-24 mx-auto mb-4 ${theme === 'blue' ? 'text-blue-500' : 'text-pink-500'}`} />
                    <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme === 'blue' ? 'from-blue-400 to-purple-500' : 'from-pink-400 to-rose-500'} bg-clip-text text-transparent mb-2`}>
                        SYAL
                    </h1>
                    <p className="text-slate-400 text-sm">Conversational AI Personal Assistant</p>
                </div>

                {loginStep === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</label>
                            <input 
                                type="email" placeholder="Gmail ID" required 
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <input 
                                type="password" placeholder="Create Password" required 
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <button type="submit" className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-lg ${currentTheme.accentBg} hover:opacity-90 transition-all`}>
                            Continue
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                         <div className="text-center mb-4">
                            <h2 className="text-lg font-semibold text-white">Personalize Alowish</h2>
                            <p className="text-xs text-slate-400">Help me get to know you better for better accuracy.</p>
                        </div>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" placeholder="Full Name" required 
                                value={fullName} onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <input 
                                type="date" required 
                                value={dob} onChange={(e) => setDob(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-slate-300"
                            />
                            <input 
                                type="text" placeholder="Profession / Work" required 
                                value={work} onChange={(e) => setWork(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <textarea 
                                placeholder="Interests & Hobbies (e.g. Cricket, Coding, Sci-Fi)" required 
                                value={hobbies} onChange={(e) => setHobbies(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                            />
                        </div>
                         <button type="submit" className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-lg ${currentTheme.accentBg} hover:opacity-90 transition-all`}>
                            Finish & Start Chat
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
  }

  // MAIN CHAT INTERFACE
  return (
    <div className={`flex h-screen w-full ${currentTheme.bg} text-slate-200 overflow-hidden relative transition-colors duration-500`}>
      {/* Background Ambience */}
      <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${isOnline ? currentTheme.gradient : 'from-gray-800/30'} to-transparent pointer-events-none transition-colors duration-1000`}></div>

      {/* Main Container */}
      <div className={`relative z-10 flex flex-col w-full max-w-md mx-auto h-full ${currentTheme.bg} border-x border-slate-800 shadow-2xl transition-colors duration-500`}>
        
        {/* Header / Status Bar */}
        <div className={`flex items-center justify-between px-4 py-3 ${currentTheme.header} backdrop-blur-md border-b border-slate-800 sticky top-0 z-20`}>
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-orange-500 shadow-[0_0_10px_#f97316]'}`}></div>
                <span className="text-xs font-semibold tracking-wider text-slate-400">
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                {isHandsFree && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-purple-500/20 rounded-full border border-purple-500/30">
                        <EarIcon className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-300 font-medium">LISTENING</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center space-x-2">
                {/* EMERGENCY SOS BUTTON */}
                <button 
                    onClick={handleSOS}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 animate-pulse text-white shadow-[0_0_15px_#dc2626] hover:bg-red-700 transition-colors"
                    title="SOS Emergency"
                    aria-label="SOS Emergency"
                >
                    <SOSIcon className="w-5 h-5" />
                </button>

                {/* LOGO IN HEADER */}
                <div className="flex items-center space-x-2">
                    <SyalLogo className={`w-6 h-6 ${theme === 'blue' ? 'text-blue-400' : 'text-pink-400'}`} />
                    <div className={`text-sm font-bold bg-gradient-to-r ${theme === 'blue' ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 to-rose-500' : 'from-gray-200 to-gray-500'} bg-clip-text text-transparent`}>
                        SYAL
                    </div>
                </div>
            </div>
            
            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white transition-colors" aria-label="Settings">
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Device Dashboard (Visual State) */}
        <div className="grid grid-cols-4 gap-2 p-2 bg-slate-900/50">
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${deviceState.flashlight ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800/50 text-slate-500'}`}>
                <FlashlightIcon className="w-5 h-5" on={deviceState.flashlight} />
                <span className="text-[10px] mt-1">Torch</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${deviceState.musicPlaying ? (theme === 'pink' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400') : 'bg-slate-800/50 text-slate-500'}`}>
                <MusicIcon className="w-5 h-5" />
                <span className="text-[10px] mt-1">{deviceState.musicPlaying ? 'Playing' : 'Music'}</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${deviceState.wifi ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 text-slate-500'}`}>
                <WifiIcon className="w-5 h-5" on={deviceState.wifi} />
                <span className="text-[10px] mt-1">Wi-Fi</span>
            </div>
             <div className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${deviceState.bluetooth ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800/50 text-slate-500'}`}>
                <BluetoothIcon className="w-5 h-5" on={deviceState.bluetooth} />
                <span className="text-[10px] mt-1">BT</span>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[80%]`}>
                        {msg.image && (
                            <div className={`mb-1 overflow-hidden rounded-xl border border-slate-700 ${msg.sender === Sender.USER ? 'self-end' : 'self-start'}`}>
                                <img src={msg.image} alt="Uploaded" className="max-h-48 w-auto object-cover" />
                            </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.sender === Sender.USER 
                            ? `${currentTheme.userBubble} text-white rounded-br-none self-end` 
                            : `${currentTheme.botBubble} text-slate-200 rounded-bl-none border border-slate-700 self-start`
                        }`}>
                            {msg.text}
                            {/* Search Results / Grounding Metadata */}
                            {msg.groundingMetadata && msg.groundingMetadata.groundingChunks && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex items-center space-x-1 text-xs text-slate-400 mb-2">
                                        <LinkIcon className="w-3 h-3" />
                                        <span className="font-semibold uppercase tracking-wider">Sources</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const uniqueLinks = new Set<string>();
                                            return msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                                                if (chunk.web && chunk.web.uri && !uniqueLinks.has(chunk.web.uri)) {
                                                    uniqueLinks.add(chunk.web.uri);
                                                    return (
                                                        <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="bg-black/30 hover:bg-black/50 text-xs px-2 py-1 rounded-md text-blue-300 truncate max-w-full flex items-center space-x-1 border border-white/10 transition-colors">
                                                            <LinkIcon className="w-3 h-3 text-slate-400" />
                                                            <span>{chunk.web.title || "Source"}</span>
                                                        </a>
                                                    );
                                                }
                                                return null;
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                            <div className="text-[10px] opacity-50 mt-1 text-right">
                                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className={`${currentTheme.botBubble} px-4 py-3 rounded-2xl rounded-bl-none flex space-x-1 items-center border border-slate-700`}>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 ${currentTheme.bg} border-t border-slate-800 transition-colors duration-500`}>
            {deviceState.musicPlaying && (
                 <div className="flex items-center justify-between bg-slate-800/80 rounded-lg p-2 mb-3 border border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${theme === 'pink' ? 'bg-pink-500' : 'bg-blue-500'} rounded-full flex items-center justify-center animate-pulse-slow`}>
                            <span className="text-xs">🎵</span>
                        </div>
                        <div className="text-xs">
                            <div className="text-white font-medium">{deviceState.currentSong}</div>
                            <div className="text-slate-400">Now Playing • Offline</div>
                        </div>
                    </div>
                    <div className="flex space-x-1 items-end h-4 mr-2">
                        <div className={`w-1 ${theme === 'pink' ? 'bg-pink-400' : 'bg-blue-400'} h-full audio-wave`} style={{animationDelay: '0s'}}></div>
                        <div className={`w-1 ${theme === 'pink' ? 'bg-pink-400' : 'bg-blue-400'} h-2/3 audio-wave`} style={{animationDelay: '0.1s'}}></div>
                        <div className={`w-1 ${theme === 'pink' ? 'bg-pink-400' : 'bg-blue-400'} h-full audio-wave`} style={{animationDelay: '0.2s'}}></div>
                    </div>
                 </div>
            )}
            
            {/* Image Preview */}
            {selectedImage && (
                <div className="flex items-center space-x-2 mb-2 bg-slate-800/50 p-2 rounded-lg w-fit border border-slate-700">
                    <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white" aria-label="Remove image">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleMicClick}
                    className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
                        isListening 
                        ? (isHandsFree ? 'bg-purple-600 text-white shadow-[0_0_15px_#9333ea] scale-110' : 'bg-red-500 text-white shadow-[0_0_15px_#ef4444] scale-110')
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    aria-label="Toggle Microphone"
                >
                   {isListening ? (
                       <div className="flex space-x-0.5 h-5 items-center justify-center w-5">
                            <div className="w-1 h-full bg-white animate-[wave_0.5s_infinite]"></div>
                            <div className="w-1 h-3/4 bg-white animate-[wave_0.5s_infinite_0.1s]"></div>
                            <div className="w-1 h-full bg-white animate-[wave_0.5s_infinite_0.2s]"></div>
                       </div>
                   ) : (
                       <MicIcon className="w-5 h-5" />
                   )}
                </button>

                <div className="flex-1 relative flex items-center space-x-2 bg-slate-800 rounded-full border border-slate-700 px-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Upload Image"
                        aria-label="Upload Image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isHandsFree ? (isListening ? "Listening..." : "Paused") : "Type 'Hey Alowish'..."}
                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm py-3 focus:outline-none"
                        disabled={isLoading}
                        aria-label="Message Input"
                    />
                </div>

                <button 
                    onClick={handleSend}
                    disabled={(!inputText.trim() && !selectedImage) || isLoading}
                    className={`p-3 ${currentTheme.accentBg} text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-black/20`}
                    aria-label="Send Message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* OCR Camera Overlay */}
        {showCamera && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover w-full h-full"></video>
                <div className="absolute bottom-10 left-0 w-full flex justify-center items-center space-x-8">
                     <button 
                        onClick={() => setShowCamera(false)}
                        className="p-4 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur"
                        aria-label="Close Camera"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={handleCapture}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:bg-white/20 transition-all"
                        aria-label="Capture Photo"
                    >
                        <div className="w-16 h-16 rounded-full bg-white"></div>
                    </button>
                </div>
                <div className="absolute top-10 left-0 w-full text-center pointer-events-none">
                    <span className="bg-black/50 text-white px-4 py-1 rounded-full text-sm backdrop-blur">Align text in frame</span>
                </div>
            </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl relative custom-scrollbar">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                aria-label="Close Settings"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              <h2 className={`text-xl font-bold mb-6 ${currentTheme.accent}`}>Settings</h2>

              {/* Profile */}
              <div className="mb-6">
                 <div className="bg-slate-800 p-3 rounded-xl mb-4">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Profile</div>
                    <div className="text-sm text-white font-medium">{userProfile?.name}</div>
                    <div className="text-xs text-slate-400">{userProfile?.email}</div>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('syal_user');
                            setUserProfile(null);
                            setIsAuthenticated(false);
                            setLoginStep('login');
                        }}
                        className="text-xs text-red-400 mt-2 hover:text-red-300"
                    >
                        Sign Out
                    </button>
                 </div>
              </div>

               {/* Emergency Contacts */}
               <div className="mb-6">
                 <label className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-3 block flex items-center">
                    <SOSIcon className="w-3 h-3 mr-1" />
                    Emergency Contacts (SOS)
                 </label>
                 <div className="bg-slate-800 p-3 rounded-xl space-y-3">
                     {userProfile?.emergencyContacts.map(contact => (
                         <div key={contact.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg">
                             <div>
                                 <div className="text-sm font-medium text-white">{contact.name}</div>
                                 <div className="text-xs text-slate-400">{contact.number}</div>
                             </div>
                             <button 
                                onClick={() => removeEmergencyContact(contact.id)}
                                className="text-slate-400 hover:text-red-400 p-1"
                             >
                                 <XMarkIcon className="w-4 h-4" />
                             </button>
                         </div>
                     ))}
                     
                     <div className="pt-2 border-t border-slate-700">
                         <div className="flex space-x-2 mb-2">
                             <input 
                                type="text" 
                                placeholder="Name" 
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                             />
                             <input 
                                type="tel" 
                                placeholder="Phone" 
                                value={newContactNumber}
                                onChange={(e) => setNewContactNumber(e.target.value)}
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                             />
                         </div>
                         <button 
                            onClick={addEmergencyContact}
                            disabled={!newContactName || !newContactNumber}
                            className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                         >
                             Add Contact
                         </button>
                     </div>
                 </div>
              </div>

              {/* Theme Selection */}
              <div className="mb-6">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setTheme('blue')}
                    className={`p-2 rounded-xl border-2 transition-all ${theme === 'blue' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                  >
                    <div className="w-full h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-2"></div>
                    <span className="text-xs text-slate-300">Blue</span>
                  </button>
                  <button 
                    onClick={() => setTheme('pink')}
                    className={`p-2 rounded-xl border-2 transition-all ${theme === 'pink' ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                  >
                    <div className="w-full h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg mb-2"></div>
                    <span className="text-xs text-slate-300">Pink</span>
                  </button>
                   <button 
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-gray-500 bg-gray-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                  >
                    <div className="w-full h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg mb-2"></div>
                    <span className="text-xs text-slate-300">Dark</span>
                  </button>
                </div>
              </div>

              {/* Accent Selection */}
              <div className="mb-6">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 block">Accent</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-800 p-1 rounded-xl">
                    {['indian', 'uk', 'us'].map((acc) => (
                    <button 
                        key={acc}
                        onClick={() => setVoiceAccent(acc as VoiceAccent)}
                        className={`py-2 text-xs font-medium rounded-lg capitalize transition-colors ${voiceAccent === acc ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {acc === 'uk' ? 'UK' : acc === 'us' ? 'US' : 'Indian'}
                    </button>
                    ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                         <label className="text-slate-200 text-sm font-medium">Talk Back</label>
                         <span className="text-slate-500 text-xs">Read responses aloud</span>
                    </div>
                    <button 
                        onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${isSpeechEnabled ? currentTheme.accentBg : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isSpeechEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                         <label className="text-slate-200 text-sm font-medium">Hands Free</label>
                         <span className="text-slate-500 text-xs">Wake word: "Hey Alowish"</span>
                    </div>
                    <button 
                        onClick={() => {
                            if (!isHandsFree) {
                                startListening(true);
                            }
                            setIsHandsFree(!isHandsFree);
                        }}
                        className={`w-12 h-6 rounded-full relative transition-colors ${isHandsFree ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isHandsFree ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
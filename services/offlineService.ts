import { OfflineResponse } from "../types";

// --- Translation Dictionary (Basic) ---
const TRANSLATION_DICT: { [key: string]: string } = {
    "hello": "namaste",
    "namaste": "hello",
    "how are you": "aap kaise hain",
    "aap kaise hain": "how are you",
    "good morning": "shubh prabhaat",
    "good night": "shubh ratri",
    "thank you": "dhanyavaad",
    "water": "paani",
    "food": "khaana",
    "help": "madad",
    "friend": "dost",
    "love": "pyaar",
    "yes": "haan",
    "no": "nahi",
    "stop": "ruko",
    "go": "jao",
    "what is your name": "aapka naam kya hai",
    "who are you": "aap kaun hain",
    "time": "samay",
    "money": "paisa",
    "house": "ghar",
    "weather": "mausam",
    "beautiful": "sundar",
    "happy": "khush",
    "price": "daam",
    "how much": "kitne ka hai",
    "kitne ka hai": "how much",
    "bhai": "brother",
    "sister": "behen"
};

// --- Formatters ---
const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
};

// --- Math Helpers ---
const safeEvaluate = (expr: string): number | null => {
    // Only allow numbers and basic operators
    if (!/^[0-9\+\-\*\/\.\s\(\)]+$/.test(expr)) return null;
    try {
        // eslint-disable-next-line no-eval
        return eval(expr);
    } catch {
        return null;
    }
};

const calculateEMI = (p: number, r: number, n: number): number => {
    // P = Loan Amount, R = Annual Rate, N = Tenure in Years
    const monthlyRate = r / (12 * 100);
    const months = n * 12;
    return (p * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

export const processOfflineMessage = (text: string): OfflineResponse => {
    const lowerText = text.toLowerCase().trim();

    // 0. EMERGENCY SOS
    if (lowerText.includes("sos") || lowerText.includes("help") || lowerText.includes("save me") || lowerText.includes("bachao") || lowerText.includes("danger") || lowerText.includes("emergency")) {
        return {
            text: "Emergency Mode Activated! Sending location to emergency contacts... 🚨",
            action: { type: 'TRIGGER_SOS', value: true }
        }
    }

    // 1. Device Controls
    if (lowerText.includes("flashlight") || lowerText.includes("torch")) {
        if (lowerText.includes("on") || lowerText.includes("jalao") || lowerText.includes("start")) {
            return {
                text: "Bilkul, flashlight on kar diya 🔦.",
                action: { type: 'TOGGLE_FLASHLIGHT', value: true }
            };
        } else if (lowerText.includes("off") || lowerText.includes("band") || lowerText.includes("stop")) {
            return {
                text: "Theek hai, flashlight off kar diya.",
                action: { type: 'TOGGLE_FLASHLIGHT', value: false }
            };
        }
    }

    if (lowerText.includes("music") || lowerText.includes("song") || lowerText.includes("gaana")) {
        if (lowerText.includes("play") || lowerText.includes("chalao") || lowerText.includes("start") || lowerText.includes("sunao")) {
            return {
                text: "Samajh gaya 👍 Offline music play kar raha hoon 🎶.",
                action: { type: 'PLAY_MUSIC' }
            };
        } else if (lowerText.includes("stop") || lowerText.includes("pause") || lowerText.includes("ruko")) {
            return {
                text: "Music pause kar diya.",
                action: { type: 'PAUSE_MUSIC' }
            };
        }
    }

    // 2. Offline OCR / Scan
    if (lowerText.includes("scan") || lowerText.includes("read text") || lowerText.includes("ocr") || lowerText.includes("read image")) {
        return {
            text: "Opening camera for offline scanning... 📸",
            action: { type: 'OPEN_CAMERA' }
        };
    }

    // 3. Offline Translate
    if (lowerText.startsWith("translate") || lowerText.includes("hindi meaning") || lowerText.includes("english meaning") || lowerText.includes("ka matlab")) {
        // Extract the word to translate
        let word = "";
        if (lowerText.includes("translate")) {
            word = lowerText.replace("translate", "").trim();
        } else if (lowerText.includes("meaning of")) {
            word = lowerText.split("meaning of")[1].trim();
        } else if (lowerText.includes("ka matlab")) {
            word = lowerText.split("ka matlab")[0].trim();
        }

        // Clean punctuation
        word = word.replace(/[?.,!]/g, "");
        
        const translation = TRANSLATION_DICT[word];
        if (translation) {
            return {
                text: `Translate: "${word}" -> "${translation}"`,
                action: { type: 'NONE' }
            };
        } else {
             return {
                text: `Sorry, mere offline dictionary mein "${word}" nahi hai. Internet connect karo toh bata paunga.`,
                action: { type: 'NONE' }
            };
        }
    }

    // 4. Offline Calculations
    
    // EMI
    if (lowerText.includes("emi")) {
        // Regex to extract numbers: loan 500000, rate 8, 5 years
        // Flexible parsing
        const numbers = lowerText.match(/(\d+(\.\d+)?)/g);
        if (numbers && numbers.length >= 3) {
            const amount = parseFloat(numbers[0]);
            const rate = parseFloat(numbers[1]);
            const years = parseFloat(numbers[2]);
            
            const emi = calculateEMI(amount, rate, years);
            return {
                text: `Loan: ${formatINR(amount)}\nRate: ${rate}%, Time: ${years} yrs.\nMonthly EMI: ${formatINR(emi)}`,
                action: { type: 'NONE' }
            };
        } else {
             return {
                text: "EMI calculate karne ke liye mujhe Amount, Rate aur Time batao. Example: 'Calculate EMI for 500000 at 8.5% for 5 years'",
                action: { type: 'NONE' }
            };
        }
    }

    // Unit Conversion (Basic)
    if (lowerText.includes("convert") || lowerText.includes(" to ")) {
        // "10 km to miles"
        const kmToMiles = lowerText.match(/(\d+)\s*km\s*to\s*miles?/);
        if (kmToMiles) {
            const val = parseFloat(kmToMiles[1]);
            return { text: `${val} km = ${(val * 0.621371).toFixed(2)} miles`, action: { type: 'NONE' }};
        }
        
        const kgToLbs = lowerText.match(/(\d+)\s*kg\s*to\s*lbs?/);
        if (kgToLbs) {
            const val = parseFloat(kgToLbs[1]);
             return { text: `${val} kg = ${(val * 2.20462).toFixed(2)} lbs`, action: { type: 'NONE' }};
        }

        const cToF = lowerText.match(/(\d+)\s*c\s*to\s*f/);
        if (cToF) {
             const val = parseFloat(cToF[1]);
             return { text: `${val}°C = ${((val * 9/5) + 32).toFixed(1)}°F`, action: { type: 'NONE' }};
        }
    }

    // General Math (calculate 50 + 20)
    if (lowerText.includes("calculate") || lowerText.match(/[\d]+\s*[\+\-\*\/]\s*[\d]+/)) {
        // Extract mathematical part
        const mathPart = lowerText.replace("calculate", "").replace("math", "").trim();
        const result = safeEvaluate(mathPart);
        if (result !== null) {
            return {
                text: `Result: ${result}`,
                action: { type: 'NONE' }
            };
        }
    }
    
    // Percentage (50 ka 20%)
    if (lowerText.includes("%")) {
         // "20% of 500"
         const percentMatch = lowerText.match(/(\d+)%\s*of\s*(\d+)/);
         if (percentMatch) {
             const p = parseFloat(percentMatch[1]);
             const v = parseFloat(percentMatch[2]);
             return { text: `${p}% of ${v} is ${(p/100)*v}`, action: { type: 'NONE' }};
         }
         
         // "500 ka 20%"
         const percentMatchHindi = lowerText.match(/(\d+)\s*ka\s*(\d+)%/);
         if (percentMatchHindi) {
             const v = parseFloat(percentMatchHindi[1]);
             const p = parseFloat(percentMatchHindi[2]);
              return { text: `${v} ka ${p}% = ${(p/100)*v}`, action: { type: 'NONE' }};
         }
    }


    // Online specific requests while offline
    if (lowerText.includes("weather") || lowerText.includes("mausam") || lowerText.includes("search") || lowerText.includes("news")) {
        return {
            text: "Abhi internet nahi hai, isliye yeh check nahi ho paayega. Main Flashlight, Music, Calculations, Translation ya OCR (Scan) kar sakta hoon.",
            action: { type: 'NONE' }
        };
    }

    // Default Fallback
    return {
        text: "Main offline hoon. Main ye kar sakta hoon:\n1. Flashlight/Music control\n2. Math & EMI Calc\n3. Translate (Basic)\n4. Scan Text (OCR) 📷",
        action: { type: 'NONE' }
    };
};
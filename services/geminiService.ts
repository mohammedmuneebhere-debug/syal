import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { UserProfile } from "../types";

// Define the functions available to the model
const toggleFlashlightDeclaration: FunctionDeclaration = {
  name: 'toggleFlashlight',
  description: 'Turn the flashlight on or off.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Either 'on' or 'off'",
        enum: ["on", "off"]
      },
    },
    required: ['action'],
  },
};

const controlMusicDeclaration: FunctionDeclaration = {
  name: 'controlMusic',
  description: 'Play or pause music.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Either 'play' or 'pause' or 'next'",
        enum: ["play", "pause", "next"]
      },
      genre: {
        type: Type.STRING,
        description: "Genre of music if specified (e.g., bollywood, pop)"
      }
    },
    required: ['action'],
  },
};

const makeCallDeclaration: FunctionDeclaration = {
  name: 'makeCall',
  description: 'Initiate a phone call to a contact or number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nameOrNumber: {
        type: Type.STRING,
        description: "The name of the contact or the phone number."
      }
    },
    required: ['nameOrNumber'],
  },
};

const toggleConnectivityDeclaration: FunctionDeclaration = {
  name: 'toggleConnectivity',
  description: 'Turn Wifi or Bluetooth on or off.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["wifi", "bluetooth"]
      },
      action: {
        type: Type.STRING,
        enum: ["on", "off"]
      }
    },
    required: ['type', 'action'],
  },
};

const triggerSOSDeclaration: FunctionDeclaration = {
  name: 'triggerSOS',
  description: 'Trigger emergency SOS protocol (Location sharing, SMS, Alert). Use this when user asks for help or is in danger.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      confirm: {
        type: Type.BOOLEAN,
        description: "Always true"
      }
    },
    required: ['confirm'],
  },
};

// --- Service Logic ---

let ai: GoogleGenAI | null = null;
let chatSession: any = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const startChatSession = (user: UserProfile | null) => {
  if (!ai) initializeGemini();
  if (!ai) return null;

  const tools: Tool[] = [
    {
      functionDeclarations: [
        toggleFlashlightDeclaration,
        controlMusicDeclaration,
        makeCallDeclaration,
        toggleConnectivityDeclaration,
        triggerSOSDeclaration
      ]
    },
    {
        googleSearch: {} // For online knowledge grounding
    }
  ];

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(user),
      tools: tools,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (
  message: string, 
  image: string | null,
  executeToolCallback: (name: string, args: any) => Promise<any>
) => {
  // Chat session should be started by the App when the user logs in
  if (!chatSession) {
    // Fallback if session wasn't started (e.g. dev HMR)
    startChatSession(null); 
  }
  if (!chatSession) throw new Error("Could not initialize Gemini");

  try {
    let messageInput: any = message;
    
    // Construct multimodal message if image is present
    if (image) {
        // Expecting data:image/png;base64,....
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        
        messageInput = {
            role: 'user',
            parts: [
                { text: message },
                { inlineData: { mimeType: mimeType, data: base64Data } }
            ]
        };
    }

    let result = await chatSession.sendMessage({ message: messageInput });
    
    // Check for function calls loop
    while (result.candidates && result.candidates[0].content.parts.some((p: any) => p.functionCall)) {
       const functionCallPart = result.candidates[0].content.parts.find((p: any) => p.functionCall);
       const { name, args, id } = functionCallPart.functionCall;
       
       console.log("Alowish Tool Call:", name, args);
       
       // Execute Client Side Logic
       const functionResponseValue = await executeToolCallback(name, args);

       // Send response back to Gemini with role 'tool'
       result = await chatSession.sendMessage({
          message: {
              role: 'tool', 
              parts: [{
                  functionResponse: {
                      name: name,
                      id: id,
                      response: { result: functionResponseValue } 
                  }
              }]
          }
       });
    }

    // Return structured response including search metadata
    return {
        text: result.text,
        groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
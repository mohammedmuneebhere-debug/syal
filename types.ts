export enum Sender {
  USER = 'user',
  ALOWISH = 'alowish',
}

export interface Message {
  id: string;
  text: string;
  image?: string; // Base64 string for uploaded images
  sender: Sender;
  timestamp: Date;
  isError?: boolean;
  groundingMetadata?: any; // For search sources/citations
}

export interface AppState {
  flashlight: boolean;
  musicPlaying: boolean;
  currentSong: string;
  wifi: boolean;
  bluetooth: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
}

export interface UserProfile {
  email: string;
  name: string;
  dob: string; // YYYY-MM-DD
  work: string;
  hobbies: string;
  emergencyContacts: EmergencyContact[];
}

export interface ToolCallData {
  name: string;
  args: any;
  id: string;
}

export interface OfflineResponse {
    text: string;
    action?: {
        type: 'TOGGLE_FLASHLIGHT' | 'PLAY_MUSIC' | 'PAUSE_MUSIC' | 'TOGGLE_WIFI' | 'TOGGLE_BLUETOOTH' | 'OPEN_CAMERA' | 'TRIGGER_SOS' | 'NONE';
        value?: boolean;
    }
}

export type Theme = 'blue' | 'pink' | 'dark';
export type VoiceAccent = 'indian' | 'uk' | 'us';
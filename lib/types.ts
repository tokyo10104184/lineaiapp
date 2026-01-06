export interface Message {
  id: string;
  sender: 'user' | string
  text: string
  timestamp: Date
  isRead?: boolean
  imageUrl?: string
  isEditing?: boolean;
  originalText?: string;
}

export interface EmotionGauges {
  intimacy: number;
  trust: number;
  mood: number;
  dependence: number;
  excitement: number;
  jealousy: number;
  curiosity: number;
  comfort: number;
  pleasure: number;
}

export interface Character {
  id: string; // Local ID
  public_id?: string | null; // DB UUID for public characters
  name: string
  description: string
  systemPrompt: string
  icon: string
  isPublic: boolean
  gauges: EmotionGauges;
  useGauges: boolean;
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  characterId: string
  isCharToCharConversation?: boolean
  participantCharacterIds?: [string, string]
  charToCharMode?: 'auto' | 'battle' | 'debate';
  debateTheme?: string;
  participantModels?: [string, string];
  isGroupChat?: boolean;
  groupParticipantIds?: string[];
}

export interface ChutesApiRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  useCensorship: boolean;
  imageDataUrl?: string;
}

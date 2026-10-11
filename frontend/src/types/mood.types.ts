export const ALLOWED_MOOD_EMOJIS = [
  '😀', '😊', '😐', '😔', '😢', '😡', '😴', '😰', '🥳', '😌'
] as const;

export type MoodEmoji = typeof ALLOWED_MOOD_EMOJIS[number];

export interface MoodEmojiInfo {
  emoji: MoodEmoji;
  label: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'energy';
}

export const MOOD_EMOJI_DETAILS: Record<MoodEmoji, MoodEmojiInfo> = {
  '😀': { emoji: '😀', label: 'Great / Joyful', sentiment: 'positive' },
  '😊': { emoji: '😊', label: 'Happy / Content', sentiment: 'positive' },
  '😌': { emoji: '😌', label: 'Peaceful / Relieved', sentiment: 'positive' },
  '🥳': { emoji: '🥳', label: 'Excited / Celebratory', sentiment: 'energy' },
  '😐': { emoji: '😐', label: 'Neutral / Okay', sentiment: 'neutral' },
  '😴': { emoji: '😴', label: 'Tired / Exhausted', sentiment: 'neutral' },
  '😔': { emoji: '😔', label: 'Down / Pensive', sentiment: 'negative' },
  '😰': { emoji: '😰', label: 'Anxious / Stressed', sentiment: 'negative' },
  '😢': { emoji: '😢', label: 'Sad / Low', sentiment: 'negative' },
  '😡': { emoji: '😡', label: 'Angry / Frustrated', sentiment: 'negative' },
};

export interface MoodEntry {
  id: string;
  helpSeekerId?: string;
  localDate: string;
  moodEmoji: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate?: string | null;
}

export interface DailyQuote {
  quote: string;
  author: string;
}

export interface MusicRecommendation {
  moodEmoji: string;
  playlistName: string;
  genre: string;
  playlistUrl: string;
}

export interface RecordMoodPayload {
  localDate: string; // YYYY-MM-DD
  moodEmoji: string;
  note?: string;
}

export interface RecordMoodResponse {
  moodEntry: MoodEntry;
  streak: StreakInfo;
  musicRecommendation: MusicRecommendation;
  quote: DailyQuote;
  isEdit: boolean;
}

export interface TodayMoodResponse {
  moodEntry: MoodEntry | null;
  streak: StreakInfo;
  quote: DailyQuote;
}

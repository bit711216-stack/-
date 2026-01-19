
export interface WordData {
  word: string;
  phonetic: string;
  meaning_kr: string;
  meaning_en: string;
  example_en: string;
  example_kr: string;
  synonyms: string[];
  antonyms: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SavedWord extends WordData {
  id: string;
  dateAdded: number;
  lastReviewed: number;
  mastery: number; // 0 to 100
}

export enum AppTab {
  DISCOVER = 'discover',
  MY_WORDS = 'my_words',
  QUIZ = 'quiz',
  SETTINGS = 'settings'
}

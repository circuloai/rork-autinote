import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjYwMDAwMDAsImV4cCI6MTk0MTU3NjAwMH0.placeholder';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = supabaseUrl || PLACEHOLDER_URL;
  const key = supabaseAnonKey || PLACEHOLDER_KEY;

  if (!isSupabaseConfigured) {
    console.warn('[Supabase] Not configured. Using placeholder client — auth and database operations will be skipped.');
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: isSupabaseConfigured,
        persistSession: isSupabaseConfigured,
        detectSessionInUrl: isSupabaseConfigured && Platform.OS === 'web',
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
}

export const supabase = createSupabaseClient();

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          caregiver_name: string | null;
          caregiver_email: string | null;
          caregiver_phone: string | null;
          therapist_phone: string | null;
          active_child_id: string | null;
          is_explore_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          caregiver_name?: string | null;
          caregiver_email?: string | null;
          caregiver_phone?: string | null;
          therapist_phone?: string | null;
          active_child_id?: string | null;
          is_explore_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          caregiver_name?: string | null;
          caregiver_email?: string | null;
          caregiver_phone?: string | null;
          therapist_phone?: string | null;
          active_child_id?: string | null;
          is_explore_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      children: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          age: number;
          diagnosis: string | null;
          grade_level: string | null;
          school_name: string | null;
          height: string | null;
          weight: string | null;
          common_triggers: string[];
          strengths: string[] | null;
          interests: string[] | null;
          avatar: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          age: number;
          diagnosis?: string | null;
          grade_level?: string | null;
          school_name?: string | null;
          height?: string | null;
          weight?: string | null;
          common_triggers?: string[];
          strengths?: string[] | null;
          interests?: string[] | null;
          avatar?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          age?: number;
          diagnosis?: string | null;
          grade_level?: string | null;
          school_name?: string | null;
          height?: string | null;
          weight?: string | null;
          common_triggers?: string[];
          strengths?: string[] | null;
          interests?: string[] | null;
          avatar?: string | null;
          created_at?: string;
        };
      };
      log_entries: {
        Row: {
          id: string;
          child_id: string;
          date: string;
          mood_rating: string;
          positive_notes: string | null;
          challenge_notes: string | null;
          mood_tags: string[];
          type: string;
          behaviors: string[] | null;
          sleep_hours: number | null;
          triggers: string[] | null;
          voice_notes: string | null;
          photos: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          date: string;
          mood_rating: string;
          positive_notes?: string | null;
          challenge_notes?: string | null;
          mood_tags?: string[];
          type: string;
          behaviors?: string[] | null;
          sleep_hours?: number | null;
          triggers?: string[] | null;
          voice_notes?: string | null;
          photos?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          date?: string;
          mood_rating?: string;
          positive_notes?: string | null;
          challenge_notes?: string | null;
          mood_tags?: string[];
          type?: string;
          behaviors?: string[] | null;
          sleep_hours?: number | null;
          triggers?: string[] | null;
          voice_notes?: string | null;
          photos?: string[] | null;
          created_at?: string;
        };
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          color_theme: string;
          font_size: string;
          text_to_speech: boolean;
          reminders: boolean;
          reminder_time: string | null;
          quick_reminders: Record<string, unknown>[] | null;
          custom_reminders: Record<string, unknown>[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          color_theme?: string;
          font_size?: string;
          text_to_speech?: boolean;
          reminders?: boolean;
          reminder_time?: string | null;
          quick_reminders?: Record<string, unknown>[] | null;
          custom_reminders?: Record<string, unknown>[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          color_theme?: string;
          font_size?: string;
          text_to_speech?: boolean;
          reminders?: boolean;
          reminder_time?: string | null;
          quick_reminders?: Record<string, unknown>[] | null;
          custom_reminders?: Record<string, unknown>[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

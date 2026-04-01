import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
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
          quick_reminders: any | null;
          custom_reminders: any | null;
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
          quick_reminders?: any | null;
          custom_reminders?: any | null;
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
          quick_reminders?: any | null;
          custom_reminders?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

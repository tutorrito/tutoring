export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'tutor' | 'admin' | null
          bio: string | null
          hourly_rate: number | null
          is_verified: boolean | null
          education: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'tutor' | 'admin' | null
          bio?: string | null
          hourly_rate?: number | null
          is_verified?: boolean | null
          education?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'tutor' | 'admin' | null
          bio?: string | null
          hourly_rate?: number | null
          is_verified?: boolean | null
          education?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      tutor_subjects: {
        Row: {
          tutor_id: string
          subject_id: string
          created_at: string
        }
        Insert: {
          tutor_id: string
          subject_id: string
          created_at?: string
        }
        Update: {
          tutor_id?: string
          subject_id?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          student_id: string | null
          tutor_id: string | null
          subject_id: string | null
          start_time: string
          duration: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          tutor_id?: string | null
          subject_id?: string | null
          start_time: string
          duration: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          tutor_id?: string | null
          subject_id?: string | null
          start_time?: string
          duration?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          session_id: string | null
          reviewer_id: string | null
          reviewee_id: string | null
          rating: number | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          receiver_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content?: string
          created_at?: string
        }
      }
    }
  }
}
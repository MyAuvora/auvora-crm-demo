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
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string
          role: 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk'
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          full_name: string
          role: 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string
          role?: 'owner' | 'manager' | 'head-coach' | 'coach' | 'front-desk'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string
          phone: string | null
          membership_type: string
          status: 'active' | 'inactive' | 'frozen' | 'cancelled'
          join_date: string
          last_visit: string | null
          payment_status: 'current' | 'overdue' | 'pending'
          next_payment_due: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email: string
          phone?: string | null
          membership_type: string
          status?: 'active' | 'inactive' | 'frozen' | 'cancelled'
          join_date: string
          last_visit?: string | null
          payment_status?: 'current' | 'overdue' | 'pending'
          next_payment_due?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string
          phone?: string | null
          membership_type?: string
          status?: 'active' | 'inactive' | 'frozen' | 'cancelled'
          join_date?: string
          last_visit?: string | null
          payment_status?: 'current' | 'overdue' | 'pending'
          next_payment_due?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string
          phone: string | null
          source: string
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          notes: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email: string
          phone?: string | null
          source: string
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string
          phone?: string | null
          source?: string
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          coach_id: string | null
          day_of_week: string
          time: string
          duration: number
          capacity: number
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          coach_id?: string | null
          day_of_week: string
          time: string
          duration: number
          capacity: number
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          coach_id?: string | null
          day_of_week?: string
          time?: string
          duration?: number
          capacity?: number
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          tenant_id: string
          class_id: string
          member_id: string
          status: 'booked' | 'checked-in' | 'cancelled' | 'no-show'
          booked_at: string
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          class_id: string
          member_id: string
          status?: 'booked' | 'checked-in' | 'cancelled' | 'no-show'
          booked_at?: string
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          class_id?: string
          member_id?: string
          status?: 'booked' | 'checked-in' | 'cancelled' | 'no-show'
          booked_at?: string
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          tenant_id: string
          member_id: string | null
          amount: number
          type: 'payment' | 'refund' | 'adjustment'
          description: string | null
          stripe_payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          member_id?: string | null
          amount: number
          type: 'payment' | 'refund' | 'adjustment'
          description?: string | null
          stripe_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          member_id?: string | null
          amount?: number
          type?: 'payment' | 'refund' | 'adjustment'
          description?: string | null
          stripe_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
      user_dashboard_layouts: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          dashboard_key: string
          widget_order: string[]
          hidden_widgets: string[]
          widget_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          dashboard_key: string
          widget_order: string[]
          hidden_widgets?: string[]
          widget_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          dashboard_key?: string
          widget_order?: string[]
          hidden_widgets?: string[]
          widget_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_history: {
        Row: {
          appointment_id: string | null
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          appointment_id?: string | null
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          appointment_id?: string | null
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          doctor_notes: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_notes: string | null
          specialty: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          doctor_notes?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_notes?: string | null
          specialty: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          doctor_notes?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_notes?: string | null
          specialty?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          google_event_id: string | null
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          google_event_id?: string | null
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          google_event_id?: string | null
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          doctor_id: string | null
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          doctor_id?: string | null
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          doctor_id?: string | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_calendars: {
        Row: {
          calendar_name: string
          created_at: string
          doctor_id: string
          google_calendar_id: string
          id: string
          is_primary: boolean | null
          updated_at: string
        }
        Insert: {
          calendar_name: string
          created_at?: string
          doctor_id: string
          google_calendar_id: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
        }
        Update: {
          calendar_name?: string
          created_at?: string
          doctor_id?: string
          google_calendar_id?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_calendars_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          consultation_fee: number | null
          created_at: string | null
          education: string | null
          google_calendar_access_token: string | null
          google_calendar_refresh_token: string | null
          id: string
          languages: string[] | null
          license_number: string | null
          specialty: string
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          id: string
          languages?: string[] | null
          license_number?: string | null
          specialty: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          id?: string
          languages?: string[] | null
          license_number?: string | null
          specialty?: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "doctor_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historias_clinicas: {
        Row: {
          created_at: string
          diagnostico: string | null
          doctor_id: string
          fecha_ingreso: string
          id: string
          medicamento: string | null
          paciente_id: string
          seguimiento: string | null
          seguimiento_completado: boolean | null
          sintoma: string | null
          tratamiento: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          doctor_id: string
          fecha_ingreso?: string
          id?: string
          medicamento?: string | null
          paciente_id: string
          seguimiento?: string | null
          seguimiento_completado?: boolean | null
          sintoma?: string | null
          tratamiento?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          doctor_id?: string
          fecha_ingreso?: string
          id?: string
          medicamento?: string | null
          paciente_id?: string
          seguimiento?: string | null
          seguimiento_completado?: boolean | null
          sintoma?: string | null
          tratamiento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historias_clinicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          apellido: string
          cedula: string
          correo: string | null
          created_at: string
          id: string
          nombre: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          apellido: string
          cedula: string
          correo?: string | null
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          apellido?: string
          cedula?: string
          correo?: string | null
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          id_number?: string | null
          last_name: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      appointments_view: {
        Row: {
          doctor_id: string | null
          doctor_name: string | null
          doctor_specialty: string | null
          duration_minutes: number | null
          id: string | null
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          specialty: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "doctor_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      available_slots_view: {
        Row: {
          doctor_id: string | null
          doctor_name: string | null
          end_time: string | null
          id: string | null
          specialty: string | null
          start_time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_view: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          education: string | null
          email: string | null
          first_name: string | null
          google_calendar_access_token: string | null
          google_calendar_refresh_token: string | null
          id: string | null
          languages: string[] | null
          last_name: string | null
          license_number: string | null
          phone: string | null
          specialty: string | null
          years_experience: number | null
        }
        Relationships: []
      }
      historias_clinicas_view: {
        Row: {
          apellido: string | null
          cedula: string | null
          correo: string | null
          created_at: string | null
          diagnostico: string | null
          doctor_id: string | null
          fecha_ingreso: string | null
          id: string | null
          medicamento: string | null
          nombre: string | null
          paciente_id: string | null
          seguimiento: string | null
          seguimiento_completado: boolean | null
          sintoma: string | null
          tratamiento: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historias_clinicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_view: {
        Row: {
          avatar_url: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "scheduled" | "confirmed" | "cancelled" | "completed"
      user_role: "doctor" | "patient" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["scheduled", "confirmed", "cancelled", "completed"],
      user_role: ["doctor", "patient", "admin"],
    },
  },
} as const

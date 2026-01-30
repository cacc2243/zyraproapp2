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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          totp_enabled: boolean
          totp_secret: string | null
          totp_verified_at: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          totp_enabled?: boolean
          totp_secret?: string | null
          totp_verified_at?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          totp_enabled?: boolean
          totp_secret?: string | null
          totp_verified_at?: string | null
          username?: string
        }
        Relationships: []
      }
      extension_logs: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          license_key: string | null
          log_type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_key?: string | null
          log_type?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_key?: string | null
          log_type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      license_challenges: {
        Row: {
          challenge_token: string
          client_public_key: string | null
          created_at: string | null
          device_fingerprint: string
          expires_at: string
          extension_id: string | null
          id: string
          nonce: string
          server_private_key: string | null
          used: boolean | null
        }
        Insert: {
          challenge_token: string
          client_public_key?: string | null
          created_at?: string | null
          device_fingerprint: string
          expires_at: string
          extension_id?: string | null
          id?: string
          nonce: string
          server_private_key?: string | null
          used?: boolean | null
        }
        Update: {
          challenge_token?: string
          client_public_key?: string | null
          created_at?: string | null
          device_fingerprint?: string
          expires_at?: string
          extension_id?: string | null
          id?: string
          nonce?: string
          server_private_key?: string | null
          used?: boolean | null
        }
        Relationships: []
      }
      license_devices: {
        Row: {
          device_fingerprint: string
          device_info: Json | null
          device_name: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_seen_at: string
          license_id: string
        }
        Insert: {
          device_fingerprint: string
          device_info?: Json | null
          device_name?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          license_id: string
        }
        Update: {
          device_fingerprint?: string
          device_info?: Json | null
          device_name?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_devices_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_logs: {
        Row: {
          action: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          license_id: string | null
          license_key: string
          metadata: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "license_logs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          license_id: string | null
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_id?: string | null
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_id?: string | null
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_rate_limits_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          expires_at: string
          id: string
          integrity_hash: string
          ip_address: string | null
          last_heartbeat: string | null
          license_id: string | null
          session_token: string
          shared_key_hash: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          expires_at: string
          id?: string
          integrity_hash: string
          ip_address?: string | null
          last_heartbeat?: string | null
          license_id?: string | null
          session_token: string
          shared_key_hash?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          expires_at?: string
          id?: string
          integrity_hash?: string
          ip_address?: string | null
          last_heartbeat?: string | null
          license_id?: string | null
          session_token?: string
          shared_key_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_sessions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          created_at: string
          customer_document_hash: string | null
          customer_email_hash: string | null
          id: string
          last_validated_at: string | null
          license_key: string
          max_devices: number
          origin: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          customer_document_hash?: string | null
          customer_email_hash?: string | null
          id?: string
          last_validated_at?: string | null
          license_key: string
          max_devices?: number
          origin?: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          customer_document_hash?: string | null
          customer_email_hash?: string | null
          id?: string
          last_validated_at?: string | null
          license_key?: string
          max_devices?: number
          origin?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          payment_api: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_api?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_api?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          subscription_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          subscription_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subscription_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          customer_document: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          license_id: string | null
          next_billing_date: string
          plan_type: string
          product_type: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          customer_document?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          license_id?: string | null
          next_billing_date: string
          plan_type: string
          product_type: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          customer_document?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          license_id?: string | null
          next_billing_date?: string
          plan_type?: string
          product_type?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          access_granted: boolean
          access_granted_at: string | null
          amount: number
          created_at: string
          customer_document: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          email_update_token: string | null
          email_update_token_expires_at: string | null
          fbc: string | null
          fbp: string | null
          id: string
          ip_address: string | null
          is_subscription: boolean | null
          license_created_at: string | null
          license_key: string | null
          license_origin: string | null
          offer_hash: string | null
          offer_title: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pepper_transaction_id: string | null
          pix_code: string | null
          pix_url: string | null
          plan_type: string | null
          product_hash: string | null
          product_title: string | null
          qr_code_base64: string | null
          src: string | null
          subscription_id: string | null
          transaction_hash: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          access_granted?: boolean
          access_granted_at?: string | null
          amount: number
          created_at?: string
          customer_document?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          email_update_token?: string | null
          email_update_token_expires_at?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          is_subscription?: boolean | null
          license_created_at?: string | null
          license_key?: string | null
          license_origin?: string | null
          offer_hash?: string | null
          offer_title?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pepper_transaction_id?: string | null
          pix_code?: string | null
          pix_url?: string | null
          plan_type?: string | null
          product_hash?: string | null
          product_title?: string | null
          qr_code_base64?: string | null
          src?: string | null
          subscription_id?: string | null
          transaction_hash?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          access_granted?: boolean
          access_granted_at?: string | null
          amount?: number
          created_at?: string
          customer_document?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          email_update_token?: string | null
          email_update_token_expires_at?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          is_subscription?: boolean | null
          license_created_at?: string | null
          license_key?: string | null
          license_origin?: string | null
          offer_hash?: string | null
          offer_title?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pepper_transaction_id?: string | null
          pix_code?: string | null
          pix_url?: string | null
          plan_type?: string | null
          product_hash?: string | null
          product_title?: string | null
          qr_code_base64?: string | null
          src?: string | null
          subscription_id?: string | null
          transaction_hash?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_period_end: {
        Args: { plan: string; start_date: string }
        Returns: string
      }
      clean_expired_security_data: { Args: never; Returns: undefined }
      clean_old_extension_logs: { Args: never; Returns: undefined }
      clean_old_rate_limit_logs: { Args: never; Returns: undefined }
      generate_license_key: { Args: never; Returns: string }
    }
    Enums: {
      device_status:
        | "active"
        | "uninstalled"
        | "revoked_by_admin"
        | "reinstall_pending"
      license_status: "pending" | "active" | "blocked" | "revoked" | "expired"
      payment_method: "credit_card" | "billet" | "pix"
      payment_status:
        | "processing"
        | "authorized"
        | "paid"
        | "refunded"
        | "waiting_payment"
        | "waiting_refund"
        | "refused"
        | "chargeback"
        | "analyzing"
        | "pending_review"
        | "antifraud"
        | "cancelled"
        | "checkout_abandoned"
      product_type:
        | "lovable"
        | "v0"
        | "manus"
        | "google_ai_ultra"
        | "metodo_conta_pro"
      subscription_plan_type: "weekly" | "monthly" | "yearly"
      subscription_status: "active" | "expired" | "cancelled" | "suspended"
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
      device_status: [
        "active",
        "uninstalled",
        "revoked_by_admin",
        "reinstall_pending",
      ],
      license_status: ["pending", "active", "blocked", "revoked", "expired"],
      payment_method: ["credit_card", "billet", "pix"],
      payment_status: [
        "processing",
        "authorized",
        "paid",
        "refunded",
        "waiting_payment",
        "waiting_refund",
        "refused",
        "chargeback",
        "analyzing",
        "pending_review",
        "antifraud",
        "cancelled",
        "checkout_abandoned",
      ],
      product_type: [
        "lovable",
        "v0",
        "manus",
        "google_ai_ultra",
        "metodo_conta_pro",
      ],
      subscription_plan_type: ["weekly", "monthly", "yearly"],
      subscription_status: ["active", "expired", "cancelled", "suspended"],
    },
  },
} as const

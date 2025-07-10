export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          additional_info: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          additional_info?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          additional_info?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          business_license: string | null
          city: string
          company_name: string
          company_registration: string | null
          contact_name: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          postal_code: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          business_license?: string | null
          city: string
          company_name: string
          company_registration?: string | null
          contact_name?: string | null
          country: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          business_license?: string | null
          city?: string
          company_name?: string
          company_registration?: string | null
          contact_name?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          active: boolean | null
          address: string | null
          business_name: string | null
          created_at: string | null
          default_currency: string | null
          drive_folder_id: string | null
          email: string | null
          fiscal_year_start: number | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          settings: Json | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          default_currency?: string | null
          drive_folder_id?: string | null
          email?: string | null
          fiscal_year_start?: number | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          business_name?: string | null
          created_at?: string | null
          default_currency?: string | null
          drive_folder_id?: string | null
          email?: string | null
          fiscal_year_start?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          active: boolean | null
          color: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          expense_type_id: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          expense_type_id?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          expense_type_id?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_charges: {
        Row: {
          active: boolean | null
          amount: number
          category_id: string | null
          charge_date: string
          created_at: string | null
          currency: string | null
          description: string
          expense_type_id: string | null
          id: string
          invoice_number: string | null
          is_subscription_charge: boolean | null
          notes: string | null
          payment_method: string | null
          receipt_drive_id: string | null
          receipt_file_name: string | null
          receipt_file_url: string | null
          subscription_id: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          category_id?: string | null
          charge_date: string
          created_at?: string | null
          currency?: string | null
          description: string
          expense_type_id?: string | null
          id?: string
          invoice_number?: string | null
          is_subscription_charge?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_drive_id?: string | null
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          subscription_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          category_id?: string | null
          charge_date?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          expense_type_id?: string | null
          id?: string
          invoice_number?: string | null
          is_subscription_charge?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_drive_id?: string | null
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          subscription_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_charges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_charges_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_charges_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_charges_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          active: boolean | null
          amount: number
          auto_renew: boolean | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          expense_date: string
          expense_type_id: string | null
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          receipt_drive_id: string | null
          receipt_file_name: string | null
          receipt_file_url: string | null
          recurring_end_date: string | null
          recurring_next_date: string | null
          recurring_period: string | null
          recurring_start_date: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          amount: number
          auto_renew?: boolean | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          expense_date: string
          expense_type_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_drive_id?: string | null
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          recurring_end_date?: string | null
          recurring_next_date?: string | null
          recurring_period?: string | null
          recurring_start_date?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number
          auto_renew?: boolean | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          expense_date?: string
          expense_type_id?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_drive_id?: string | null
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          recurring_end_date?: string | null
          recurring_next_date?: string | null
          recurring_period?: string | null
          recurring_start_date?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_history: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_id: string | null
          invoice_number: string
          language: string
          service_period_from: string
          service_period_to: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          client_name: string
          created_at: string
          currency: string
          due_date: string
          id?: string
          invoice_id?: string | null
          invoice_number: string
          language: string
          service_period_from: string
          service_period_to: string
          status: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string
          language?: string
          service_period_from?: string
          service_period_to?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_address: string
          client_business_license: string | null
          client_city: string
          client_company: string
          client_company_registration: string | null
          client_country: string
          client_id: string | null
          client_postal_code: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          due_date: string
          exchange_rate: number | null
          id: string
          invoice_date: string
          invoice_number: string
          issued_at: string | null
          language: string
          service_period_end: string
          service_period_start: string
          services: Json
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          vat_amount: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_address: string
          client_business_license?: string | null
          client_city: string
          client_company: string
          client_company_registration?: string | null
          client_country: string
          client_id?: string | null
          client_postal_code?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date: string
          exchange_rate?: number | null
          id?: string
          invoice_date: string
          invoice_number: string
          issued_at?: string | null
          language?: string
          service_period_end: string
          service_period_start: string
          services?: Json
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
          vat_amount?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_address?: string
          client_business_license?: string | null
          client_city?: string
          client_company?: string
          client_company_registration?: string | null
          client_country?: string
          client_id?: string | null
          client_postal_code?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date?: string
          exchange_rate?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          issued_at?: string | null
          language?: string
          service_period_end?: string
          service_period_start?: string
          services?: Json
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          last_login: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          currency: string
          default_rate: number
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          default_rate: number
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          default_rate?: number
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          expense_type_id: string | null
          id: string
          is_active: boolean | null
          name: string
          next_charge_date: string
          notes: string | null
          payment_method: string | null
          recurring_period: string
          start_date: string
          supplier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          expense_type_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          next_charge_date: string
          notes?: string | null
          payment_method?: string | null
          recurring_period: string
          start_date: string
          supplier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          expense_type_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_charge_date?: string
          notes?: string | null
          payment_method?: string | null
          recurring_period?: string
          start_date?: string
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: string | null
          company_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const

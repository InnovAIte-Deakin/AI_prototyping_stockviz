export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
        }
        Relationships: []
      }
      api_call_log: {
        Row: {
          api_name: string
          created_at: string
          endpoint: string
          id: number
          response_time: number | null
          success: boolean | null
          symbol: string | null
          timeframe: string | null
        }
        Insert: {
          api_name: string
          created_at?: string
          endpoint: string
          id?: never
          response_time?: number | null
          success?: boolean | null
          symbol?: string | null
          timeframe?: string | null
        }
        Update: {
          api_name?: string
          created_at?: string
          endpoint?: string
          id?: never
          response_time?: number | null
          success?: boolean | null
          symbol?: string | null
          timeframe?: string | null
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          acquired_at: string | null
          avg_price: number
          created_at: string
          id: string
          notes: string | null
          shares: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          avg_price: number
          created_at?: string
          id?: string
          notes?: string | null
          shares: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          avg_price?: number
          created_at?: string
          id?: string
          notes?: string | null
          shares?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_transactions: {
        Row: {
          executed_at: string
          id: string
          realized_pl_usd: number | null
          shares: number
          side: string
          symbol: string
          total_cash_delta_usd: number
          unit_price_usd: number
          user_id: string
        }
        Insert: {
          executed_at?: string
          id?: string
          realized_pl_usd?: number | null
          shares: number
          side: string
          symbol: string
          total_cash_delta_usd: number
          unit_price_usd: number
          user_id: string
        }
        Update: {
          executed_at?: string
          id?: string
          realized_pl_usd?: number | null
          shares?: number
          side?: string
          symbol?: string
          total_cash_delta_usd?: number
          unit_price_usd?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          paper_cash_usd: number
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          paper_cash_usd?: number
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          paper_cash_usd?: number
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          created_at: string
          exchange_mic: string | null
          id: string
          last_price: number | null
          name: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exchange_mic?: string | null
          id?: string
          last_price?: number | null
          name?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exchange_mic?: string | null
          id?: string
          last_price?: number | null
          name?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          stock_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          stock_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          stock_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_history: {
        Row: {
          id: string
          user_id: string
          total_value_usd: number
          paper_cash_usd: number
          holdings_value_usd: number
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_value_usd: number
          paper_cash_usd: number
          holdings_value_usd: number
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_value_usd?: number
          paper_cash_usd?: number
          holdings_value_usd?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      paper_buy: {
        Args: {
          p_shares: number
          p_symbol: string
          p_unit_price_usd: number
          p_user_id: string
        }
        Returns: undefined
      }
      paper_sell: {
        Args: {
          p_shares: number
          p_symbol: string
          p_unit_price_usd: number
          p_user_id: string
        }
        Returns: undefined
      }
      record_portfolio_snapshot: {
        Args: {
          p_user_id: string
          p_total_value: number
          p_cash: number
          p_holdings_value: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const


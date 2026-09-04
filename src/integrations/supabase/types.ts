export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      abuse_events: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_hint: string | null;
          visitor_key: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_hint?: string | null;
          visitor_key: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_hint?: string | null;
          visitor_key?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          category: string;
          clicks: number;
          coupon_code: string | null;
          created_at: string;
          description: string;
          discount_label: string;
          expires_at: string | null;
          id: string;
          initials: string;
          merchant: string;
          owner_key: string | null;
          starts_at: string;
          tint: string;
          title: string;
          url: string;
          vote_count: number;
        };
        Insert: {
          category: string;
          clicks?: number;
          coupon_code?: string | null;
          created_at?: string;
          description: string;
          discount_label: string;
          expires_at?: string | null;
          id?: string;
          initials?: string;
          merchant: string;
          owner_key?: string | null;
          starts_at?: string;
          tint?: string;
          title: string;
          url: string;
          vote_count?: number;
        };
        Update: {
          category?: string;
          clicks?: number;
          coupon_code?: string | null;
          created_at?: string;
          description?: string;
          discount_label?: string;
          expires_at?: string | null;
          id?: string;
          initials?: string;
          merchant?: string;
          owner_key?: string | null;
          starts_at?: string;
          tint?: string;
          title?: string;
          url?: string;
          vote_count?: number;
        };
        Relationships: [];
      };
      rank_targets: {
        Row: {
          created_at: string;
          id: string;
          offer_id: string;
          owner_key: string;
          target_rank: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          offer_id: string;
          owner_key: string;
          target_rank?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          offer_id?: string;
          owner_key?: string;
          target_rank?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rank_targets_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          offer_id: string;
          voter_key: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          offer_id: string;
          voter_key: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          offer_id?: string;
          voter_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      enforce_rate_limit: {
        Args: { _action: string; _max: number; _visitor_key: string; _window_minutes: number };
        Returns: undefined;
      };
      prune_abuse_events: { Args: never; Returns: number };
      rpc_register_click: {
        Args: { _offer_id: string; _visitor_key: string };
        Returns: undefined;
      };
      rpc_save_rank_target: {
        Args: { _offer_id: string; _target_rank: number | null; _visitor_key: string };
        Returns: string;
      };
      rpc_submit_offer: {
        Args: {
          _category: string;
          _coupon_code: string | null;
          _description: string;
          _discount_label: string;
          _expires_at: string | null;
          _initials: string;
          _merchant: string;
          _starts_at: string;
          _tint: string;
          _title: string;
          _url: string;
          _visitor_key: string;
        };
        Returns: Database["public"]["Tables"]["offers"]["Row"];
      };
      rpc_toggle_vote: {
        Args: { _offer_id: string; _visitor_key: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

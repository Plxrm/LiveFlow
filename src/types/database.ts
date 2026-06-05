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
      customers: {
        Row: {
          id: string
          line_user_id: string | null
          display_name: string | null
          picture_url: string | null
          phone: string | null
          address: string | null
          address_detail: string | null
          subdistrict: string | null
          district: string | null
          province: string | null
          zipcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_user_id?: string | null
          display_name?: string | null
          picture_url?: string | null
          phone?: string | null
          address?: string | null
          address_detail?: string | null
          subdistrict?: string | null
          district?: string | null
          province?: string | null
          zipcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_user_id?: string | null
          display_name?: string | null
          picture_url?: string | null
          phone?: string | null
          address?: string | null
          address_detail?: string | null
          subdistrict?: string | null
          district?: string | null
          province?: string | null
          zipcode?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          compare_price: number | null
          cost: number | null
          sku: string | null
          image_url: string | null
          stock: number
          is_active: boolean
          free_shipping: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: number
          compare_price?: number | null
          cost?: number | null
          sku?: string | null
          image_url?: string | null
          stock?: number
          is_active?: boolean
          free_shipping?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          cost?: number | null
          sku?: string | null
          image_url?: string | null
          stock?: number
          is_active?: boolean
          free_shipping?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_keys: {
        Row: {
          id: string
          product_id: string
          key_code: string
          price: number
          status: 'available' | 'reserved' | 'sold'
          order_id: string | null
          sold_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          key_code: string
          price: number
          status?: 'available' | 'reserved' | 'sold'
          order_id?: string | null
          sold_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          key_code?: string
          price?: number
          status?: 'available' | 'reserved' | 'sold'
          order_id?: string | null
          sold_at?: string | null
          created_at?: string
        }
      }
      live_sessions: {
        Row: {
          id: string
          title: string
          status: 'draft' | 'live' | 'ended'
          started_at: string | null
          ended_at: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          status?: 'draft' | 'live' | 'ended'
          started_at?: string | null
          ended_at?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          status?: 'draft' | 'live' | 'ended'
          started_at?: string | null
          ended_at?: string | null
          note?: string | null
          created_at?: string
        }
      }
      live_products: {
        Row: {
          id: string
          live_session_id: string
          product_id: string
          cf_code: string
          live_price: number
          max_per_person: number | null
          created_at: string
        }
        Insert: {
          id?: string
          live_session_id: string
          product_id: string
          cf_code: string
          live_price: number
          max_per_person?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          live_session_id?: string
          product_id?: string
          cf_code?: string
          live_price?: number
          max_per_person?: number | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          live_session_id: string | null
          status: 'pending' | 'confirmed' | 'paid' | 'shipping' | 'completed' | 'cancelled'
          total: number
          shipping_fee: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          live_session_id?: string | null
          status?: 'pending' | 'confirmed' | 'paid' | 'shipping' | 'completed' | 'cancelled'
          total: number
          shipping_fee?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          live_session_id?: string | null
          status?: 'pending' | 'confirmed' | 'paid' | 'shipping' | 'completed' | 'cancelled'
          total?: number
          shipping_fee?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          price: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          price?: number
          quantity?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          method: 'transfer' | 'promptpay' | 'cod'
          slip_url: string | null
          amount: number
          status: 'pending' | 'confirmed' | 'rejected'
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          method: 'transfer' | 'promptpay' | 'cod'
          slip_url?: string | null
          amount: number
          status?: 'pending' | 'confirmed' | 'rejected'
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          method?: 'transfer' | 'promptpay' | 'cod'
          slip_url?: string | null
          amount?: number
          status?: 'pending' | 'confirmed' | 'rejected'
          confirmed_at?: string | null
          created_at?: string
        }
      }
      cf_logs: {
        Row: {
          id: string
          customer_id: string | null
          line_user_id: string | null
          raw_message: string
          parsed_cf_code: string | null
          live_session_id: string | null
          is_valid: boolean
          error_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          line_user_id?: string | null
          raw_message: string
          parsed_cf_code?: string | null
          live_session_id?: string | null
          is_valid?: boolean
          error_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          line_user_id?: string | null
          raw_message?: string
          parsed_cf_code?: string | null
          live_session_id?: string | null
          is_valid?: boolean
          error_reason?: string | null
          created_at?: string
        }
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          carrier: string
          tracking_number: string | null
          label_pdf_url: string | null
          status: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled'
          kex_con_no: string | null
          kex_ref_no: string | null
          kex_lh_route: string | null
          kex_del_route: string | null
          kex_service_code: string | null
          kex_status_desc: string | null
          shipped_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          carrier: string
          tracking_number?: string | null
          label_pdf_url?: string | null
          status?: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled'
          kex_con_no?: string | null
          kex_ref_no?: string | null
          kex_lh_route?: string | null
          kex_del_route?: string | null
          kex_service_code?: string | null
          kex_status_desc?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          carrier?: string
          tracking_number?: string | null
          label_pdf_url?: string | null
          status?: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled'
          kex_con_no?: string | null
          kex_ref_no?: string | null
          kex_lh_route?: string | null
          kex_del_route?: string | null
          kex_service_code?: string | null
          kex_status_desc?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          step: string
          sort_order: number
          msg_type: 'text' | 'image' | 'flex'
          content: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          step: string
          sort_order?: number
          msg_type: 'text' | 'image' | 'flex'
          content?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          step?: string
          sort_order?: number
          msg_type?: 'text' | 'image' | 'flex'
          content?: string | null
          image_url?: string | null
          is_active?: boolean
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

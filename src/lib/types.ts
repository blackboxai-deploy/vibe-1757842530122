// Type definitions for the application

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql_query?: string;
  sql_results?: unknown;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  extracted_data?: {
    amount?: number;
    date?: string;
    vendor?: string;
    invoice_number?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface SqlQuery {
  id: string;
  user_id: string;
  query: string;
  results?: unknown;
  error?: string;
  execution_time?: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql_query?: string;
  sql_results?: unknown;
  timestamp: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  include_sql?: boolean;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sql_query?: string;
  sql_results?: unknown;
  error?: string;
}
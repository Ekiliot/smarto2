export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  is_admin?: boolean
  role?: 'user' | 'admin' | 'support'
  created_at: string
  updated_at?: string
}

export interface Chat {
  id: string
  user_id: string
  status: 'open' | 'closed' | 'pending'
  subject: string
  last_message_at: string
  created_at: string
  updated_at: string
  user?: User
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  text?: string
  file_url?: string
  file_type?: 'image' | 'video' | 'document' | 'audio'
  file_name?: string
  file_size?: number
  is_read: boolean
  created_at: string
  sender?: User
}

export interface ChatWithMessages extends Chat {
  messages: Message[]
}

export interface FileUpload {
  file: File
  type: 'image' | 'video' | 'document' | 'audio'
  preview?: string
  uploadProgress?: number
}

export interface ChatFilters {
  status?: 'open' | 'closed' | 'pending'
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ChatStats {
  total_chats: number
  open_chats: number
  closed_chats: number
  pending_chats: number
  total_messages: number
  unread_messages: number
} 
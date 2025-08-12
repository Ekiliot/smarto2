import { createClient } from '@supabase/supabase-js'
import { Chat, Message, ChatWithMessages, ChatFilters, ChatStats } from '@/lib/types/chat'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ===== ЧАТЫ =====

export async function getUserActiveChat(userId: string): Promise<Chat | null> {
  try {
    // Сначала пробуем через RPC функцию
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_active_chat', {
        user_uuid: userId
      })
      
      if (!rpcError && rpcData) {
        // Если RPC вернул ID чата, получаем полные данные
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            user:profiles(
              id,
              email,
              first_name,
              last_name,
              created_at
            )
          `)
          .eq('id', rpcData)
          .single()
        
        if (!chatError && chatData) {
          return chatData
        }
      }
    } catch (rpcError) {
      console.log('RPC function not available, using direct query')
    }

    // Прямой запрос к таблице
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        user:profiles(
          id,
          email,
          first_name,
          last_name,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No active chat found for user:', userId)
        return null
      }
      console.error('Error getting user active chat:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserActiveChat:', error)
    return null
  }
}

export async function createUserChat(userId: string, subject: string = 'Вопрос по заказу'): Promise<string | null> {
  // Сначала проверяем, есть ли уже активный чат
  const activeChat = await getUserActiveChat(userId)
  if (activeChat) {
    return activeChat.id
  }

  // Создаем новый чат
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      subject: subject,
      status: 'open'
    })
    .select(`
      id,
      user:profiles(
        id,
        email,
        first_name,
        last_name,
        created_at
      )
    `)
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    return null
  }

  return data.id
}

export async function getChatWithMessages(chatId: string): Promise<ChatWithMessages | null> {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      user:profiles(
        id,
        email,
        first_name,
        last_name,
        created_at
      ),
      messages:messages(
        id,
        chat_id,
        sender_id,
        text,
        file_url,
        file_type,
        file_name,
        file_size,
        is_read,
        created_at,
        sender:profiles(
          id,
          email,
          first_name,
          last_name
        )
      )
    `)
    .eq('id', chatId)
    .single()

  if (error) {
    console.error('Error getting chat with messages:', error)
    return null
  }

  console.log('Chat with messages data:', data)

  // Сортируем сообщения по времени
  if (data.messages) {
    data.messages.sort((a: Message, b: Message) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  return data
}

export async function getAllChats(filters: ChatFilters = {}): Promise<Chat[]> {
  console.log('getAllChats called with filters:', filters)
  
  let query = supabase
    .from('chats')
    .select(`
      *,
      user:profiles(
        id,
        email,
        first_name,
        last_name,
        created_at
      ),
      last_message:messages(
        id,
        text,
        file_url,
        file_type,
        created_at
      )
    `)
    .order('last_message_at', { ascending: false })

  console.log('SQL query structure:', {
    table: 'chats',
    select: 'profiles join and messages join',
    orderBy: 'last_message_at DESC'
  })

  // Применяем фильтры
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    query = query.or(`subject.ilike.%${filters.search}%,profiles.email.ilike.%${filters.search}%`)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  console.log('SQL query built, executing...')
  const { data, error } = await query

  if (error) {
    console.error('Error getting all chats:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return []
  }

  console.log('Raw chat data:', data)
  console.log('Raw chat data length:', data?.length || 0)

  // Детальная отладка первого чата
  if (data && data.length > 0) {
    const firstChat = data[0]
    console.log('First chat detailed:', {
      id: firstChat.id,
      user_id: firstChat.user_id,
      user: firstChat.user,
      userType: typeof firstChat.user,
      hasUser: !!firstChat.user,
      userKeys: firstChat.user ? Object.keys(firstChat.user) : 'N/A'
    })
  }

  // Обрабатываем данные для правильного отображения
  const chats = data || []
  const processedChats = chats.map(chat => ({
    ...chat,
    user: chat.user || null,
    last_message: chat.last_message?.[0] || null, // Берем первое сообщение как последнее
    unread_count: 0 // Пока не реализовано
  }))

  console.log('Processed chats:', processedChats)
  console.log('Processed chats length:', processedChats.length)
  
  return processedChats
}

export async function updateChatStatus(chatId: string, status: 'open' | 'closed' | 'pending'): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .update({ status })
    .eq('id', chatId)

  if (error) {
    console.error('Error updating chat status:', error)
    return false
  }

  return true
}

// ===== СООБЩЕНИЯ =====

export async function sendMessage(chatId: string, senderId: string, text?: string, fileData?: {
  file_url: string
  file_type: string
  file_name: string
  file_size: number
}): Promise<Message | null> {
  const messageData: any = {
    chat_id: chatId,
    sender_id: senderId
  }

  if (text) {
    messageData.text = text
  }

  if (fileData) {
    Object.assign(messageData, fileData)
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select(`
      *,
      sender:profiles(*)
    `)
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  return data
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) {
    console.error('Error marking message as read:', error)
    return false
  }

  return true
}

export async function markChatMessagesAsRead(chatId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)

  if (error) {
    console.error('Error marking chat messages as read:', error)
    return false
  }

  return true
}

// ===== ФАЙЛЫ =====

export async function uploadChatFile(
  file: File, 
  userId: string, 
  chatId: string
): Promise<{ file_url: string; file_type: string; file_name: string; file_size: number } | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `user_${userId}/${chatId}/${fileName}`

  // Определяем тип файла
  let fileType: 'image' | 'video' | 'document' | 'audio' = 'document'
  if (file.type.startsWith('image/')) fileType = 'image'
  else if (file.type.startsWith('video/')) fileType = 'video'
  else if (file.type.startsWith('audio/')) fileType = 'audio'

  // Проверяем размер файла (20MB)
  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('Файл слишком большой. Максимальный размер: 20MB')
  }

  const { data, error } = await supabase.storage
    .from('chat_files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading file:', error)
    return null
  }

  // Получаем public URL
  const { data: urlData } = supabase.storage
    .from('chat_files')
    .getPublicUrl(filePath)

  return {
    file_url: urlData.publicUrl,
    file_type: fileType,
    file_name: file.name,
    file_size: file.size
  }
}

// ===== СТАТИСТИКА =====

export async function getChatStats(): Promise<ChatStats | null> {
  const { data, error } = await supabase
    .rpc('get_chat_stats')

  if (error) {
    console.error('Error getting chat stats:', error)
    return null
  }

  return data
}

// ===== REALTIME =====

export function subscribeToChatMessages(chatId: string, callback: (message: Message) => void) {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        callback(payload.new as Message)
      }
    )
    .subscribe()
}

export function subscribeToChatUpdates(callback: (chat: Chat) => void) {
  return supabase
    .channel('chat_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chats'
      },
      (payload) => {
        callback(payload.new as Chat)
      }
    )
    .subscribe()
}

// ===== УТИЛИТЫ =====

// Получение количества непрочитанных сообщений для чата
export async function getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .is('read_at', null)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error)
    return 0
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isImageFile(fileType: string): boolean {
  return fileType === 'image'
}

export function isVideoFile(fileType: string): boolean {
  return fileType === 'video'
}

export function isAudioFile(fileType: string): boolean {
  return fileType === 'audio'
}

export function isDocumentFile(fileType: string): boolean {
  return fileType === 'document'
} 
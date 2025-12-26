import { supabaseClient } from './supabaseService';
import { apiCall } from './errorService';

/**
 * Chat Service
 * Handles all chat-related operations including group buy chats and direct messages
 */

/**
 * Generate thread ID for group buy chat
 */
export function getGroupBuyThreadId(productId) {
  return `group_buy_${productId}`;
}

/**
 * Generate thread ID for direct chat between two users
 * Sorts emails alphabetically to ensure consistent thread IDs
 */
export function getDirectThreadId(user1Email, user2Email) {
  const sorted = [user1Email, user2Email].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

/**
 * Send a message to a group buy chat
 */
export async function sendGroupBuyMessage(productId, content, senderEmail) {
  return await apiCall(async () => {
    const threadId = getGroupBuyThreadId(productId);
    
    // For group buy chats, receiver_email is null (all participants see it)
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        product_id: productId,
        chat_type: 'group_buy',
        thread_id: threadId,
        sender_email: senderEmail,
        receiver_email: null, // Group chats don't have a specific receiver
        content: content.trim(),
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, message: data };
  }, {
    context: 'Sending group buy message',
    showToast: false
  });
}

/**
 * Send a direct message to another user
 */
export async function sendDirectMessage(receiverEmail, content, senderEmail) {
  return await apiCall(async () => {
    const threadId = getDirectThreadId(senderEmail, receiverEmail);
    
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        chat_type: 'direct',
        thread_id: threadId,
        sender_email: senderEmail,
        receiver_email: receiverEmail,
        content: content.trim(),
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, message: data };
  }, {
    context: 'Sending direct message',
    showToast: false
  });
}

/**
 * Load all messages for a group buy
 */
export async function loadGroupBuyMessages(productId) {
  return await apiCall(async () => {
    const threadId = getGroupBuyThreadId(productId);
    
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('chat_type', 'group_buy')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Transform database format to app format
    const messages = (data || []).map(msg => ({
      id: msg.id,
      productId: msg.product_id,
      errandId: msg.errand_id,
      chatType: msg.chat_type,
      threadId: msg.thread_id,
      senderEmail: msg.sender_email,
      receiverEmail: msg.receiver_email,
      content: msg.content,
      read: msg.read,
      createdAt: msg.created_at
    }));
    
    return { success: true, messages };
  }, {
    context: 'Loading group buy messages',
    showToast: false
  });
}

/**
 * Load direct messages between two users
 */
export async function loadDirectMessages(otherUserEmail, currentUserEmail) {
  return await apiCall(async () => {
    const threadId = getDirectThreadId(currentUserEmail, otherUserEmail);
    
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('chat_type', 'direct')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Transform database format to app format
    const messages = (data || []).map(msg => ({
      id: msg.id,
      productId: msg.product_id,
      errandId: msg.errand_id,
      chatType: msg.chat_type,
      threadId: msg.thread_id,
      senderEmail: msg.sender_email,
      receiverEmail: msg.receiver_email,
      content: msg.content,
      read: msg.read,
      createdAt: msg.created_at
    }));
    
    return { success: true, messages };
  }, {
    context: 'Loading direct messages',
    showToast: false
  });
}

/**
 * Mark messages as read for a specific thread
 */
export async function markMessagesAsRead(threadId, userEmail) {
  return await apiCall(async () => {
    // Update messages where user is receiver and they're unread
    const { error } = await supabaseClient
      .from('messages')
      .update({ read: true })
      .eq('thread_id', threadId)
      .eq('read', false)
      .neq('sender_email', userEmail); // Don't mark own messages as read
    
    if (error) throw error;
    return { success: true };
  }, {
    context: 'Marking messages as read',
    showToast: false
  });
}

/**
 * Get unread message count for a thread
 */
export async function getUnreadCount(threadId, userEmail) {
  return await apiCall(async () => {
    const { data, error } = await supabaseClient
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', threadId)
      .eq('read', false)
      .neq('sender_email', userEmail);
    
    if (error) throw error;
    return { success: true, count: data?.length || 0 };
  }, {
    context: 'Getting unread count',
    showToast: false
  });
}

/**
 * Get all chat threads for a user (group buys they're part of + direct messages)
 */
export async function getUserChatThreads(userEmail) {
  return await apiCall(async () => {
    // Get all messages where user is involved (as sender or receiver, or in group buy)
    const { data, error } = await supabaseClient
      .from('messages')
      .select('thread_id, chat_type, product_id, sender_email, receiver_email, content, created_at')
      .or(`sender_email.eq.${userEmail},receiver_email.eq.${userEmail}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Also get group buy messages where user has orders
    const { data: groupBuyMessages, error: groupBuyError } = await supabaseClient
      .from('messages')
      .select('thread_id, chat_type, product_id, sender_email, receiver_email, content, created_at')
      .eq('chat_type', 'group_buy')
      .order('created_at', { ascending: false });
    
    // Combine both results
    const allMessages = [...(data || [])];
    if (groupBuyMessages) {
      // Filter group buy messages where user has an order
      const { data: userOrders } = await supabaseClient
        .from('orders')
        .select('product_id')
        .eq('customer_email', userEmail);
      
      const userProductIds = new Set((userOrders || []).map(o => o.product_id));
      groupBuyMessages.forEach(msg => {
        if (msg.product_id && userProductIds.has(msg.product_id)) {
          allMessages.push(msg);
        }
      });
    }
    
    // Group by thread_id and get latest message for each
    const threadMap = new Map();
    allMessages.forEach(msg => {
      if (!msg.thread_id) return;
      
      const existing = threadMap.get(msg.thread_id);
      if (!existing || new Date(msg.created_at) > new Date(existing.lastMessageTime)) {
        threadMap.set(msg.thread_id, {
          threadId: msg.thread_id,
          chatType: msg.chat_type,
          productId: msg.product_id,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          // For direct chats, determine the other user
          otherUserEmail: msg.chat_type === 'direct' 
            ? (msg.sender_email === userEmail ? msg.receiver_email : msg.sender_email)
            : null
        });
      }
    });
    
    // Sort threads by last message time
    const threads = Array.from(threadMap.values()).sort((a, b) => {
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    return { success: true, threads };
  }, {
    context: 'Loading user chat threads',
    showToast: false
  });
}


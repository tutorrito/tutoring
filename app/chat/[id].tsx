import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/types/supabase';
import { ArrowLeft, Send, Paperclip, XCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

type ProfileForMessage = Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'id'> & {
  avatar_public_url?: string | null;
};

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: ProfileForMessage | null;
};
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  tutor_profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'id'> | null;
  student_profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'id'> | null;
};

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationDetails, setConversationDetails] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true, // Recommended for uploads
      });
      console.log('[ChatScreen] handlePickDocument: DocumentPicker result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 10 * 1024 * 1024) { // 10MB limit
          Alert.alert('File too large', 'Please select a file smaller than 10MB.');
          setSelectedFile(null);
          return;
        }
        setSelectedFile(result);
      } else {
        setSelectedFile(null); // Clear if cancelled or no assets
      }
    } catch (error) {
      console.error('[ChatScreen] handlePickDocument: Error picking document:', error);
      Alert.alert('Error', 'Could not select file. Please try again.');
      setSelectedFile(null);
    }
  };

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async (messageIdsToMarkRead: string[]) => {
    if (!user || messageIdsToMarkRead.length === 0) return;

    console.log(`[ChatScreen] markMessagesAsRead: Marking ${messageIdsToMarkRead.length} messages as read.`);
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIdsToMarkRead)
      .eq('conversation_id', conversationId) // Ensure we only update for the current conversation
      .neq('sender_id', user.id); // Ensure user doesn't mark their own messages as read by themselves

    if (error) {
      console.error('[ChatScreen] markMessagesAsRead: Error updating messages to read:', error);
    } else {
      console.log('[ChatScreen] markMessagesAsRead: Successfully marked messages as read in DB.');
      // UI will update via real-time update subscription or by updating local state directly
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          messageIdsToMarkRead.includes(msg.id) && msg.sender_id !== user.id
            ? { ...msg, is_read: true }
            : msg
        )
      );
    }
  }, [conversationId, user]);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId) {
      console.log('[ChatScreen] fetchConversationDetails: No conversationId, returning.');
      return;
    }
    console.log(`[ChatScreen] fetchConversationDetails: Fetching for ID: ${conversationId}`);
    const { data, error } = await supabase
      .from('conversations')
      .select('*, tutor_profiles:profiles!conversations_tutor_id_fkey(id, full_name), student_profiles:profiles!conversations_student_id_fkey(id, full_name)')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('[ChatScreen] fetchConversationDetails: Error fetching conversation details:', error);
      Alert.alert("Error", "Could not load conversation details.");
      // Consider not navigating back automatically to allow user to see the error or retry.
      // router.back(); 
    } else {
      console.log('[ChatScreen] fetchConversationDetails: Successfully fetched conversation details.');
      setConversationDetails(data as Conversation);
    }
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      console.log('[ChatScreen] fetchMessages: No conversationId, returning.');
      setLoading(false);
      return;
    }
    console.log(`[ChatScreen] fetchMessages: Fetching messages for conversationId: ${conversationId}`);
    setLoading(true);
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, full_name)') // Corrected: removed avatar_url from here
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[ChatScreen] fetchMessages: Error fetching messages:', messagesError.message, messagesError);
      setMessages([]);
      setLoading(false);
      return;
    }
    
    if (messagesData && messagesData.length > 0) {
      console.log(`[ChatScreen] fetchMessages: Successfully fetched ${messagesData.length} messages. Processing avatars and read status...`);
      
      const unreadMessageIdsFromOthers: string[] = [];
      messagesData.forEach(msg => {
        // Ensure msg.profiles is not null and is an object before accessing its properties
        if (msg.profiles && typeof msg.profiles === 'object' && msg.sender_id !== user?.id && !msg.is_read) {
          unreadMessageIdsFromOthers.push(msg.id);
        }
      });

      if (unreadMessageIdsFromOthers.length > 0) {
        markMessagesAsRead(unreadMessageIdsFromOthers);
      }

      const messagesWithAvatars = await Promise.all(
        messagesData.map(async (msg) => {
          let avatar_public_url: string | null = null;
          // Ensure msg.profiles is not null and is an object before accessing its properties
          const profileData = msg.profiles as ProfileForMessage | null; // Type assertion for clarity

          if (profileData && profileData.id) {
            try {
              const { data: imageData, error: imageError } = await supabase
                .from('profile_images')
                .select('image_path')
                .eq('user_id', profileData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (imageError && imageError.code !== 'PGRST116') {
                console.warn(`[ChatScreen] fetchMessages: Error fetching avatar for ${profileData.id}:`, imageError.message);
              } else if (imageData?.image_path) {
                const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(imageData.image_path);
                avatar_public_url = publicUrlData?.publicUrl || null;
              }
            } catch (e) {
              console.warn(`[ChatScreen] fetchMessages: Exception fetching avatar for ${profileData.id}:`, e);
            }
          }
          
          const isNowRead = unreadMessageIdsFromOthers.includes(msg.id) && msg.sender_id !== user?.id;
          
          // Ensure msg.profiles is spread correctly if it exists
          const updatedProfileInfo = profileData ? { ...profileData, avatar_public_url } : null;

          return {
            ...msg,
            is_read: msg.is_read || isNowRead,
            profiles: updatedProfileInfo,
          } as Message;
        })
      );
      setMessages(messagesWithAvatars);
      console.log('[ChatScreen] fetchMessages: Finished processing avatars and read status, messages count:', messagesWithAvatars.length);
    } else {
      console.log('[ChatScreen] fetchMessages: No messagesData or messagesData is empty.');
      setMessages([]);
    }
    setLoading(false);
  }, [conversationId, user, markMessagesAsRead]);

  useEffect(() => {
    console.log('[ChatScreen] Initial useEffect: Fetching conversation details and messages for conversationId:', conversationId);
    if (conversationId) {
      fetchConversationDetails();
      fetchMessages();
    } else {
      console.warn('[ChatScreen] Initial useEffect: conversationId is missing.');
      setLoading(false); 
    }
  }, [conversationId, fetchConversationDetails, fetchMessages]);

  useEffect(() => {
    if (!conversationId) {
      console.log('[ChatScreen] Real-time useEffect: conversationId is missing, skipping subscription.');
      return;
    }
    console.log('[ChatScreen] Real-time useEffect: Setting up subscription for conversationId:', conversationId);

    const channelName = `chat-conv-${conversationId}`; // More specific channel name
    const messageFilter = `conversation_id=eq.${conversationId}`;

    const channel = supabase.channel(channelName);

    channel.on<Database['public']['Tables']['messages']['Row']>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: messageFilter },
      async (payload) => {
        console.log('[ChatScreen] Real-time INSERT: New message received:', JSON.stringify(payload.new, null, 2));
        const newMessageData = payload.new;
        let profileDataForNewMessage: ProfileForMessage | null = null;

        if (newMessageData.sender_id) {
          const { data: profileInfo, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', newMessageData.sender_id)
            .single();

          if (profileError) {
            console.error("[ChatScreen] Real-time INSERT: Error fetching profile:", profileError.message);
          } else if (profileInfo) {
            profileDataForNewMessage = { ...profileInfo, avatar_public_url: null };
            // Fetch avatar for new message
            try {
              const { data: imageData } = await supabase
                .from('profile_images')
                .select('image_path')
                .eq('user_id', profileInfo.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              if (imageData?.image_path) {
                const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(imageData.image_path);
                profileDataForNewMessage.avatar_public_url = publicUrlData?.publicUrl || null;
              }
            } catch (e) { /* Avatar fetch error */ }
          }
        }
        
        // If the new message is from the other user, mark it as read
        let finalNewMessage = { ...newMessageData, profiles: profileDataForNewMessage } as Message;
        if (newMessageData.sender_id !== user?.id) {
          console.log('[ChatScreen] Real-time INSERT: New message from other user. Marking as read.');
          markMessagesAsRead([newMessageData.id]); // This will also update local state via its own logic or the UPDATE listener
          finalNewMessage.is_read = true; // Optimistically update for immediate UI
        }

        setMessages((prevMessages) => {
          if (prevMessages.find(msg => msg.id === finalNewMessage.id)) {
            return prevMessages.map(msg => msg.id === finalNewMessage.id ? finalNewMessage : msg); // Update if exists (e.g. from optimistic send)
          }
          return [...prevMessages, finalNewMessage];
        });
      }
    );

    channel.on<Database['public']['Tables']['messages']['Row']>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: messageFilter },
      (payload) => {
        console.log('[ChatScreen] Real-time UPDATE: Message updated:', JSON.stringify(payload.new, null, 2));
        const updatedMessageData = payload.new;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === updatedMessageData.id
              ? { ...msg, ...updatedMessageData, profiles: msg.profiles } // Preserve existing profile data if not in payload
              : msg
          )
        );
      }
    );

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('[ChatScreen] Real-time: Successfully subscribed to channel:', channelName);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('[ChatScreen] Real-time: Subscription error/closed:', status, err);
        // Optionally, attempt to resubscribe or notify user
      }
    });

    return () => {
      console.log('[ChatScreen] Real-time useEffect cleanup: Removing channel for conversationId:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, markMessagesAsRead]);
  
  useEffect(() => {
    if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);


  const handleSend = async () => {
    console.log('[ChatScreen] handleSend: Attempting to send. newMessage:', newMessage, 'selectedFile:', !!selectedFile, 'user:', !!user, 'conversationId:', conversationId, 'sending:', sending);
    if ((!newMessage.trim() && !selectedFile) || !user || !conversationId || sending) {
      console.log('[ChatScreen] handleSend: Conditions not met (no message content or file, or already sending).');
      if (!selectedFile && !newMessage.trim()) {
        Alert.alert("Empty Message", "Please type a message or select a file to send.");
      }
      return;
    }

    setSending(true);
    let fileUrl: string | null = null;
    let fileMimeType: string | undefined;

    if (selectedFile && !selectedFile.canceled && selectedFile.assets && selectedFile.assets.length > 0) {
      const asset = selectedFile.assets[0];
      const fileName = asset.name;
      const filePath = `${conversationId}/${Date.now()}_${fileName}`; // Removed 'public/' prefix
      fileMimeType = asset.mimeType;

      try {
        // Expo's DocumentPicker provides a URI that needs to be fetched to get a Blob/File
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        console.log(`[ChatScreen] handleSend: Uploading file: ${fileName} (Type: ${blob.type}, Size: ${blob.size}) to path: ${filePath}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('upload') // Ensure this bucket exists and has appropriate policies
          .upload(filePath, blob, {
            contentType: blob.type, // Use the blob's type
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        console.log('[ChatScreen] handleSend: File uploaded successfully. Path:', uploadData.path);
        const { data: publicUrlData } = supabase.storage
          .from('upload')
          .getPublicUrl(uploadData.path);
        
        fileUrl = publicUrlData.publicUrl;
        console.log('[ChatScreen] handleSend: Public URL for file:', fileUrl);

      } catch (e) {
        console.error('[ChatScreen] handleSend: Error uploading file:', e);
        Alert.alert('Upload Error', 'Could not upload your file. Please try again.');
        setSending(false);
        return;
      }
    }

    const messagePayload: Database['public']['Tables']['messages']['Insert'] = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(), // Content can be empty if a file is attached
      file_url: fileUrl,
    };
    
    // If there's no text content but there is a file, set content to indicate a file was sent
    if (!messagePayload.content && fileUrl) {
        messagePayload.content = (selectedFile && !selectedFile.canceled && selectedFile.assets && selectedFile.assets[0].name) || "File attached";
    }


    const { data: insertedData, error } = await supabase
      .from('messages')
      .insert(messagePayload)
      .select('*, profiles:sender_id(id, full_name)') // Fetch profile with it
      .single();

    setSending(false);

    if (error) {
      console.error('[ChatScreen] handleSend: Error sending message:', error);
      Alert.alert('Error', 'Could not send your message. Please try again.');
    } else if (insertedData) {
      console.log('[ChatScreen] handleSend: Message sent successfully and data retrieved:', JSON.stringify(insertedData, null, 2));
      
      // Use profile data from insertedData if available, otherwise fallback
      const profileForUI = insertedData.profiles || {
        id: user!.id,
        full_name: user?.user_metadata?.full_name || 'You',
        avatar_public_url: null, // Will be updated by real-time if needed
      };
      
      const messageForUI: Message = {
        ...insertedData,
        profiles: profileForUI as ProfileForMessage, // Cast to ensure type correctness
      };

      setMessages(prevMessages => [...prevMessages, messageForUI]);
      setNewMessage('');
      setSelectedFile(null); // Clear selected file

      // ---- START: Add notification logic ----
      if (conversationDetails && user) {
        const recipientId = user.id === conversationDetails.student_id
          ? conversationDetails.tutor_id
          : conversationDetails.student_id;

        // Ensure recipientId is valid and different from the sender
        if (recipientId && recipientId !== user.id) {
          const actualSenderName = user?.user_metadata?.full_name || 'Someone';
          
          // Prepare payload for the Edge Function
          const functionArgs = {
            recipient_id: recipientId,
            type: 'new_message',
            message: `You have a new message from ${actualSenderName}.`,
            metadata: {
              conversation_id: conversationId,
              sender_id: user.id,
              sender_name: actualSenderName,
              // You could add a deep link URL here if needed for push notifications later
              // deep_link: `yourappscheme://chat/${conversationId}` 
            }
          };

          console.log('[ChatScreen] handleSend: Invoking create-notification Edge Function for recipient:', recipientId, 'Args:', JSON.stringify(functionArgs));
          
          const { data: fnResponse, error: fnError } = await supabase.functions.invoke('create-notification', {
            body: functionArgs,
          });

          if (fnError) {
            console.error('[ChatScreen] handleSend: Error invoking create-notification function:', fnError);
            // Optionally, inform the user or log this more formally
            // Alert.alert('Error', 'Could not send notification.');
          } else {
            console.log('[ChatScreen] handleSend: create-notification function invoked successfully. Response:', fnResponse);
          }
        } else {
          console.warn('[ChatScreen] handleSend: Could not determine recipient ID or recipient is sender for notification. Recipient ID:', recipientId, 'User ID:', user?.id);
        }
      } else {
        console.warn('[ChatScreen] handleSend: conversationDetails or user not available for sending notification. ConversationDetails:', !!conversationDetails, 'User:', !!user);
      }
      // ---- END: Add notification logic ----
    } else {
      // Should not happen if error is null, but as a safeguard
      console.warn('[ChatScreen] handleSend: Message sent but no data returned.');
      setNewMessage(''); // Still clear input
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    const avatarUrl = item.profiles?.avatar_public_url;
    const isImageFile = item.file_url && /\.(jpeg|jpg|gif|png)$/i.test(item.file_url);

    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMyMessage && (
          avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble, !isMyMessage && styles.otherMessageBubbleWithAvatar]}>
          {!isMyMessage && item.profiles?.full_name && (
            <Text style={styles.senderName}>{item.profiles.full_name}</Text>
          )}
          
          {item.content && (item.content !== ((selectedFile && !selectedFile.canceled && selectedFile.assets && selectedFile.assets[0].name) || "File attached") || !item.file_url) && (
             <Text style={[styles.messageText, { color: isMyMessage ? '#FFFFFF' : '#1F2937' }]}>
                {item.content}
             </Text>
          )}

          {item.file_url && (
            isImageFile ? (
              <TouchableOpacity onPress={() => Linking.openURL(item.file_url!)}>
                <Image source={{ uri: item.file_url }} style={styles.attachedImage} resizeMode="contain" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL(item.file_url!)} style={styles.fileAttachment}>
                <Paperclip size={16} color={isMyMessage ? '#E0E7FF' : '#4F46E5'} style={{marginRight: 6}}/>
                <Text style={[styles.fileAttachmentText, { color: isMyMessage ? '#E0E7FF' : '#4F46E5' }]}>
                  {item.content || 'View Attachment'}
                </Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.messageInfoContainer}>
            <Text style={[styles.messageTime, { color: isMyMessage ? '#E0E7FF' : '#9CA3AF' }]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMyMessage && item.is_read && (
              <Text style={[styles.seenIndicator, { color: '#E0E7FF' }]}>Seen</Text>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  const otherUserName = user?.id === conversationDetails?.student_id 
    ? conversationDetails?.tutor_profiles?.full_name 
    : conversationDetails?.student_profiles?.full_name;


  if (loading && messages.length === 0 && !conversationDetails) { // Adjusted loading condition
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }
  
  if (!conversationDetails && !loading) { // If still no details after loading attempt
     return (
      <View style={[styles.container, styles.centered]}>
        <Text>Conversation not found or access denied.</Text>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
            <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
        <View style={{width: 24}} /> 
      </View>

      {loading && messages.length === 0 ? (
         <View style={[styles.container, styles.centered, {flex: 1}]}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={[styles.container, styles.centered, {flex: 1}]}>
            <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {selectedFile && selectedFile.assets && selectedFile.assets.length > 0 && (
        <View style={styles.selectedFileContainer}>
          <Paperclip size={16} color="#4B5563" style={{ marginRight: 8 }} />
          <Text style={styles.selectedFileName} numberOfLines={1} ellipsizeMode="middle">
            {selectedFile.assets[0].name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.clearFileButton}>
            <XCircle size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument}>
          <Paperclip size={22} color="#4F46E5" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (sending || (!newMessage.trim() && !selectedFile)) && styles.sendButtonDisabled]} 
          onPress={handleSend} 
          disabled={sending || (!newMessage.trim() && !selectedFile)}>
          {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40, 
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButtonHeader: {
    padding: 8, 
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  messagesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end', 
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#E5E7EB', 
  },
  avatarPlaceholder: {
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#4F46E5', 
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  otherMessageBubbleWithAvatar: {
  },
  senderName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#6B7280', 
    marginBottom: 2,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  messageTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Aligns time and seen indicator to the right
    marginTop: 4,
  },
  seenIndicator: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginLeft: 6, // Space between time and "Seen"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, 
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, // Adjust padding for Android multiline
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1F2937',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5B4FC', 
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyChatText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  attachedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0E7FF', // Light blue, adjust as needed
    borderRadius: 8,
    marginTop: 8,
    maxWidth: '80%',
  },
  fileAttachmentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB', // Light gray background
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  selectedFileName: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4B5563',
  },
  clearFileButton: {
    paddingLeft: 8,
  }
});

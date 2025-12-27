'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

// Хуки
import { 
  useSupportState, 
  useTicketActions, 
  useTypingStatus, 
  useFileUpload,
  useSupportRealtime 
} from './hooks';

// Компоненты
import {
  SupportSidebar,
  TicketList,
  ChatView,
  NewTicketModal,
  EmptyState,
} from './components';

export default function SupportPage() {
  const router = useRouter();
  
  // Используем хуки
  const state = useSupportState();
  
  const {
    user, setUser,
    tickets, setTickets,
    selectedTicket, setSelectedTicket,
    messages, setMessages,
    newMessage, setNewMessage,
    loading, setLoading,
    sending, setSending,
    uploadingFile, setUploadingFile,
    showNewTicket, setShowNewTicket,
    showSettings, setShowSettings,
    isTyping, setIsTyping,
    newTicketSubject, setNewTicketSubject,
    newTicketMessage, setNewTicketMessage,
    notifications, setNotifications,
    soundEnabled, setSoundEnabled,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    messagesEndRef,
    fileInputRef,
    filteredTickets,
    scrollToBottom,
  } = state;

  // Typing хук
  const { stopTyping, handleTyping } = useTypingStatus({
    user,
    selectedTicket,
    setNewMessage,
  });

  // Действия с тикетами
  const {
    loadTickets,
    selectTicket,
    sendMessage,
    createTicket,
    closeTicket,
    deleteTicket,
  } = useTicketActions({
    user,
    selectedTicket,
    setMessages,
    setSelectedTicket,
    setTickets,
    setSending,
    setNewMessage,
    setShowNewTicket,
    setNewTicketSubject,
    setNewTicketMessage,
    stopTyping,
  });

  // Загрузка файлов
  const { uploadFile } = useFileUpload({
    user,
    selectedTicket,
    setUploadingFile,
    fileInputRef,
  });

  // Realtime подписки
  useSupportRealtime({
    user,
    selectedTicket,
    notifications,
    soundEnabled,
    setSelectedTicket,
    setMessages,
    setIsTyping,
    loadTickets,
  });

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        router.push('/auth');
        return;
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const combinedUser = { ...authUser, ...profile };
      setUser(combinedUser);
      setLoading(false);
    };

    checkAuth();
  }, [router, setUser, setLoading]);

  // Загрузка тикетов после авторизации
  useEffect(() => {
    if (user?.id) {
      loadTickets();
    }
  }, [user?.id, loadTickets]);

  // Скролл при новых сообщениях
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Экран загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <SupportSidebar
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        notifications={notifications}
        setNotifications={setNotifications}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onNewTicket={() => setShowNewTicket(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Ticket list */}
        <TicketList
          tickets={filteredTickets}
          selectedTicket={selectedTicket}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectTicket={selectTicket}
        />

        {/* Chat / Empty state */}
        {selectedTicket && user ? (
          <ChatView
            ticket={selectedTicket}
            messages={messages}
            user={user}
            newMessage={newMessage}
            sending={sending}
            uploadingFile={uploadingFile}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            fileInputRef={fileInputRef}
            onMessageChange={handleTyping}
            onSendMessage={() => sendMessage(newMessage)}
            onFileUpload={uploadFile}
            onCloseTicket={closeTicket}
            onBack={() => setSelectedTicket(null)}
          />
        ) : (
          <EmptyState onAction={() => setShowNewTicket(true)} />
        )}
      </div>

      {/* New ticket modal */}
      <NewTicketModal
        show={showNewTicket}
        subject={newTicketSubject}
        message={newTicketMessage}
        onSubjectChange={setNewTicketSubject}
        onMessageChange={setNewTicketMessage}
        onSubmit={() => createTicket(newTicketSubject, newTicketMessage)}
        onClose={() => setShowNewTicket(false)}
      />
    </div>
  );
}

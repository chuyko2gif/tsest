import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Message, SupportUser, FilterState, TicketStatus } from '../types';

export interface UseSupportStateReturn {
  // User
  user: SupportUser | null;
  setUser: (user: SupportUser | null) => void;
  
  // Tickets
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  
  // Messages
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  
  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
  sending: boolean;
  setSending: (sending: boolean) => void;
  uploadingFile: boolean;
  setUploadingFile: (uploading: boolean) => void;
  
  // UI states
  showNewTicket: boolean;
  setShowNewTicket: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  
  // New ticket form
  newTicketSubject: string;
  setNewTicketSubject: (subject: string) => void;
  newTicketMessage: string;
  setNewTicketMessage: (message: string) => void;
  
  // Settings
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Filter
  filterStatus: TicketStatus;
  setFilterStatus: (status: TicketStatus) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  
  // Computed
  filteredTickets: Ticket[];
  
  // Actions
  scrollToBottom: () => void;
}

export function useSupportState(): UseSupportStateReturn {
  // User
  const [user, setUser] = useState<SupportUser | null>(null);
  
  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Loading
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // UI
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // New ticket form
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  
  // Settings
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Filter
  const [filterStatus, setFilterStatus] = useState<TicketStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Computed: filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return t.subject.toLowerCase().includes(query) || 
             t.last_message_preview?.toLowerCase().includes(query);
    }
    return true;
  });
  
  // Actions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  return {
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
    typingTimeoutRef,
    filteredTickets,
    scrollToBottom,
  };
}

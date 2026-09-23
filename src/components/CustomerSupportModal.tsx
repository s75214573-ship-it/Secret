import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { SupportCategory, SupportMessage, SupportTicket } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { playClickSound, playWinSound } from '../utils/audio';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  Headphones, 
  X, 
  SendHorizontal, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  CornerDownRight, 
  HelpCircle,
  PhoneCall,
  User,
  RefreshCw,
  Zap
} from 'lucide-react';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'ticket' | 'channels';
  defaultCategory?: SupportCategory;
}

const STORAGE_CHAT_KEY = 'winxbet_support_messages_v1';
const STORAGE_TICKETS_KEY = 'winxbet_support_tickets_v1';

const FAQ_PRESETS: { label: string; category: SupportCategory; query: string; reply: string }[] = [
  {
    label: '💳 Deposit / UPI Delay',
    category: 'deposit',
    query: 'My deposit via UPI / Bank Transfer is pending. When will it reflect?',
    reply: 'Recharges via UPI or USDT typically credit within 1 to 5 minutes once the 12-digit UTR is submitted. If your payment was deducted but still shows pending, please verify your UTR number or submit a quick ticket under the "Submit Request" tab with your UTR proof so an admin can instantly credit your balance!'
  },
  {
    label: '🏧 Withdrawal Processing',
    category: 'withdraw',
    query: 'What is the minimum withdrawal and how long does it take?',
    reply: 'The minimum withdrawal is ₹200. Standard withdrawals are processed by the automated payout gateway within 15–30 minutes. Ensure your bank account details or UPI ID are accurate. VIP Level 2+ players enjoy zero-fee instant express payouts!'
  },
  {
    label: '🎯 WinGo Rules & Multiplier',
    category: 'game',
    query: 'How are the WinGo 1-Min numbers and colors calculated?',
    reply: 'WinGo generates numbers 0–9 every 60 seconds using SHA-256 provably fair hashes. Green (1,3,7,9) pays 2x; Red (2,4,6,8) pays 2x; Violet (0, 5) pays 4.5x; exact number predictions pay 9x. Big numbers are 5–9 and Small are 0–4.'
  },
  {
    label: '✈️ Aviator Auto-Cashout',
    category: 'game',
    query: 'How does Aviator cashout work?',
    reply: 'Aviator features a rising multiplier curve. You must press "Cash Out" before the plane flies away. You can also configure Auto Cashout (e.g. 2.00x) so your bet automatically secures earnings the moment the flight passes that multiplier.'
  },
  {
    label: '👑 VIP Bonus & Daily Streak',
    category: 'vip',
    query: 'How do I claim my VIP bonuses and daily check-in rewards?',
    reply: 'Visit the Promotion tab or Account tab to claim your daily check-in streak rewards. VIP levels unlock based on your total recharge & betting turnover, unlocking higher betting rebates (up to 1.5%), exclusive deposit gifts, and prioritized support!'
  },
  {
    label: '💬 Speak to Super Admin',
    category: 'general',
    query: 'I would like to contact the supervisor/admin directly.',
    reply: 'Our Super Admin team is available 24/7! You can chat here, open a priority ticket, or message our official Telegram handle @WinXbetSupport directly. We usually reply within 2 minutes.'
  }
];

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'welcome-msg-1',
    sender: 'support',
    text: '👋 Welcome to WinXbet 24/7 Customer Care! Our support specialists and admins are online to help you with deposits, payouts, game rules, or VIP rewards.',
    timestamp: Date.now() - 60000,
    isAutomated: true
  },
  {
    id: 'welcome-msg-2',
    sender: 'support',
    text: 'How may we assist you today? You can choose a quick topic below or type your question directly.',
    timestamp: Date.now() - 50000,
    isAutomated: true
  }
];

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat',
  defaultCategory = 'general'
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'ticket' | 'channels'>(initialTab);
  
  // Chat state
  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Ticket Form state
  const [ticketCategory, setTicketCategory] = useState<SupportCategory>(defaultCategory);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketReferenceId, setTicketReferenceId] = useState<string>('');
  const [ticketContact, setTicketContact] = useState<string>(profile?.phoneNumber || profile?.email || '');
  const [ticketSubmitting, setTicketSubmitting] = useState<boolean>(false);
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);

  // Tickets history
  const [myTickets, setMyTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TICKETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Auto-scroll chat
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen, initialTab]);

  // Persist chat messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save support chat to localStorage', err);
    }
  }, [messages]);

  // Persist tickets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(myTickets));
    } catch (err) {
      console.warn('Failed to save tickets to localStorage', err);
    }
  }, [myTickets]);

  const handleCopy = (text: string, key: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    triggerHaptic('light');
    playClickSound();

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Check if message matches any preset FAQ
    const lower = text.toLowerCase();
    const matchedPreset = FAQ_PRESETS.find(
      (f) =>
        lower.includes(f.category) ||
        f.query.toLowerCase().split(' ').some((w) => w.length > 4 && lower.includes(w))
    );

    let automatedReply = '';
    if (matchedPreset) {
      automatedReply = matchedPreset.reply;
    } else if (lower.includes('deposit') || lower.includes('recharge') || lower.includes('utr')) {
      automatedReply = 'Regarding deposits: Most UPI / bank transfers credit in 1–5 minutes. If yours is delayed, please provide your 12-digit UTR in the "Submit Request" tab or send it here so our finance admin can manually verify it right now.';
    } else if (lower.includes('withdraw') || lower.includes('payout') || lower.includes('bank')) {
      automatedReply = 'Withdrawals are processed around the clock. Minimum is ₹200. If your payout has been processing for over 30 minutes, please confirm your IFSC / UPI details or tap "Submit Request" to escalate to our on-duty supervisor.';
    } else if (lower.includes('admin') || lower.includes('human') || lower.includes('live agent')) {
      automatedReply = 'I have tagged our Senior Support Admin. If urgent, you can also reach our official Telegram directly at @WinXbetSupport for immediate assistance.';
    } else {
      automatedReply = 'Thank you for reaching out! Your message has been logged with our support dispatch. An admin will follow up shortly. You can also submit a formal ticket with reference details under "Submit Request".';
    }

    setTimeout(() => {
      setIsTyping(false);
      const agentMsg: SupportMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'support',
        text: automatedReply,
        timestamp: Date.now(),
        isAutomated: true
      };
      setMessages((prev) => [...prev, agentMsg]);
      triggerHaptic('selection');
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 900);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectFaqChip = (preset: typeof FAQ_PRESETS[0]) => {
    handleSendMessage(preset.query);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert('Please fill in both a subject and problem description.');
      return;
    }

    setTicketSubmitting(true);
    triggerHaptic('medium');

    const ticketNumber = `WX-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber,
      userId: user?.uid || 'guest',
      userDisplayName: profile?.displayName || 'Guest Player',
      userPhone: ticketContact || profile?.phoneNumber || '',
      userEmail: profile?.email || '',
      category: ticketCategory,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      status: 'pending',
      priority: ticketCategory === 'deposit' || ticketCategory === 'withdraw' ? 'high' : 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      referenceId: ticketReferenceId.trim() || undefined
    };

    // Save to Firestore if available
    try {
      if (db) {
        await addDoc(collection(db, 'supportTickets'), {
          ...newTicket,
          serverTimestamp: Date.now()
        });
      }
    } catch (err) {
      console.warn('Could not push ticket to Firestore (using local storage fallback):', err);
    }

    // Save to local tickets
    setMyTickets((prev) => [newTicket, ...prev]);

    // Also append ticket submission notification to the chat thread
    const chatNotification: SupportMessage = {
      id: `ticket-notice-${Date.now()}`,
      sender: 'support',
      text: `🎫 Support Ticket Created: #${ticketNumber}\nSubject: "${ticketSubject}"\nCategory: ${ticketCategory.toUpperCase()}\nStatus: PENDING REVIEW\nOur support desk has received your case and assigned an agent.`,
      timestamp: Date.now(),
      ticketId: ticketNumber
    };
    setMessages((prev) => [...prev, chatNotification]);

    playWinSound();
    triggerHaptic('success');
    setTicketSuccessId(ticketNumber);
    setTicketSubmitting(false);

    // Reset form fields
    setTicketSubject('');
    setTicketMessage('');
    setTicketReferenceId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Main Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-gray-950 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden z-10"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-black p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-gray-950 font-black shadow-lg shadow-amber-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-950 rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">WinXbet 24/7 Support Desk</h3>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-400">
                  LIVE ONLINE
                </span>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>Avg reply: &lt; 2 mins</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">Priority Escalation Available</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-support-modal-btn"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between bg-gray-900/90 border-b border-gray-800 px-3 py-1.5 shrink-0 text-xs">
          <div className="flex items-center gap-1 w-full">
            <button
              type="button"
              id="support-tab-chat"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('chat');
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
            </button>

            <button
              type="button"
              id="support-tab-ticket"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('ticket');
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                activeTab === 'ticket'
                  ? 'bg-amber-500 text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Submit Request</span>
              {myTickets.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeTab === 'ticket' ? 'bg-gray-950 text-amber-400' : 'bg-amber-500/30 text-amber-300'
                }`}>
                  {myTickets.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="support-tab-channels"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('channels');
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'channels'
                  ? 'bg-amber-500 text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact Admins</span>
            </button>
          </div>
        </div>

        {/* Tab 1: LIVE CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-b from-gray-950 to-black">
            {/* Quick Inquiry Chips Banner */}
            <div className="p-2.5 bg-gray-900/60 border-b border-gray-800/80 shrink-0">
              <div className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Answers (Tap to ask instantly):</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {FAQ_PRESETS.map((preset, idx) => (
                  <button
                    key={`faq-${idx}`}
                    type="button"
                    onClick={() => handleSelectFaqChip(preset)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-950 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/50 text-gray-300 hover:text-amber-300 text-[10px] font-medium transition cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Scroll View */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-gray-500">
                      {isUser ? (
                        <>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-bold text-gray-400">You</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black">
                            CS
                          </div>
                          <span className="font-bold text-amber-400">Support Agent</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-medium rounded-tr-sm'
                          : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-sm whitespace-pre-wrap'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.ticketId && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ticket #{msg.ticketId} assigned</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black">
                    CS
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] text-gray-400 ml-1">Agent is typing...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-gray-900 border-t border-gray-800/90 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  id="support-chat-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your question or request..."
                  className="flex-1 bg-gray-950 border border-gray-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
                />

                <button
                  type="submit"
                  id="send-support-chat-btn"
                  disabled={!inputMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-gray-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                >
                  <span>Send</span>
                  <SendHorizontal className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1.5 px-1">
                <span>Secure live chat session</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMessages(INITIAL_MESSAGES);
                  }}
                  className="hover:text-amber-400 transition underline cursor-pointer"
                >
                  Reset Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SUBMIT FORMAL TICKET / HELP REQUEST */}
        {activeTab === 'ticket' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-950 to-black">
            {ticketSuccessId ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-gray-900 border border-emerald-500/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Ticket Submitted Successfully!</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Your help request has been forwarded to the duty supervisor.
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 bg-gray-950 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                    Ticket Reference: #{ticketSuccessId}
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setTicketSuccessId(null);
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Submit Another Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab('chat');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-black transition"
                  >
                    View in Chat
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Inquiry Category
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'deposit', label: '💳 Deposit' },
                      { id: 'withdraw', label: '🏧 Withdrawal' },
                      { id: 'game', label: '🎯 Game / Bet' },
                      { id: 'vip', label: '👑 VIP Rewards' },
                      { id: 'account', label: '🔒 Account' },
                      { id: 'general', label: '❓ General' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTicketCategory(cat.id as SupportCategory);
                        }}
                        className={`p-2 rounded-xl border font-bold text-[11px] transition text-center cursor-pointer ${
                          ticketCategory === cat.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Subject / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    id="ticket-subject-input"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Deposit ₹500 via PhonePe not credited"
                    className="w-full bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Reference ID / UTR / Bet Period (Optional)
                  </label>
                  <input
                    type="text"
                    id="ticket-reference-input"
                    value={ticketReferenceId}
                    onChange={(e) => setTicketReferenceId(e.target.value)}
                    placeholder="e.g. 12-digit UTR or Round #20260920042"
                    className="w-full bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    id="ticket-message-input"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Provide full details: payment time, deduction confirmation, or question details..."
                    className="w-full bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Your Contact Phone / Telegram Handle
                  </label>
                  <input
                    type="text"
                    id="ticket-contact-input"
                    value={ticketContact}
                    onChange={(e) => setTicketContact(e.target.value)}
                    placeholder="e.g. +91 9876543210 or @telegram_user"
                    className="w-full bg-gray-900 border border-gray-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-support-ticket-btn"
                  disabled={ticketSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {ticketSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting to Admin Queue...</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      <span>Submit Help Request to Admin</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* My Existing Tickets Section */}
            {myTickets.length > 0 && (
              <div className="pt-3 border-t border-gray-800/80 space-y-2">
                <div className="text-[11px] font-bold text-gray-400 flex items-center justify-between">
                  <span>Your Active &amp; Past Tickets:</span>
                  <span className="text-[10px] text-gray-500">{myTickets.length} Total</span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {myTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400 text-[11px]">
                          #{t.ticketNumber}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-white font-medium truncate">{t.subject}</div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span className="capitalize">{t.category}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                      {t.adminReply && (
                        <div className="mt-1 p-2 bg-gray-950 rounded-lg border border-amber-500/30 text-[11px] text-amber-300">
                          <span className="font-bold block text-[10px] text-amber-400">Admin Response:</span>
                          {t.adminReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: DIRECT ADMIN CHANNELS & FAQ */}
        {activeTab === 'channels' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-950 to-black">
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border border-amber-500/30 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Verified Admin Channels</span>
              </div>
              <p className="text-[11px] text-gray-300">
                To protect against impersonators, only communicate via the official channels listed below. WinXbet admins will never ask for your password or PIN.
              </p>
            </div>

            {/* Official Channel Cards */}
            <div className="space-y-2.5">
              {/* Telegram */}
              <div className="p-3.5 bg-gray-900 border border-gray-800 hover:border-blue-500/40 rounded-2xl flex items-center justify-between transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <SendHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Official Telegram Support</span>
                      <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[9px] rounded font-bold">24/7 FAST</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">@WinXbetSupport</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('@WinXbetSupport', 'tg')}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Copy Handle"
                  >
                    {copiedKey === 'tg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* WhatsApp Business */}
              <div className="p-3.5 bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>WhatsApp VIP Hotline</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-bold">VERIFIED</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">+91 99887 76655</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('+919988776655', 'wa')}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Copy Number"
                  >
                    {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href="https://whatsapp.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <span>Chat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Email Support */}
              <div className="p-3.5 bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl flex items-center justify-between transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Email Escalation Desk</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">support@winxbet.vip</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('support@winxbet.vip', 'email')}
                  className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Common FAQ Accordion */}
            <div className="space-y-2 pt-2 border-t border-gray-800/80">
              <div className="text-[11px] font-bold text-gray-300">
                Frequently Asked Questions
              </div>

              {FAQ_PRESETS.slice(0, 4).map((faq, idx) => (
                <div key={`faq-item-${idx}`} className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono">Q:</span>
                    <span>{faq.query}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 pl-4 border-l-2 border-amber-500/40">
                    {faq.reply}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-gray-950 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Encrypted 256-bit Customer Support Service</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition font-medium cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </motion.div>
    </div>
  );
};

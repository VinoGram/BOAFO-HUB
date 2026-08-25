import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useParams } from "wouter";
import { useNotification } from "@/contexts/NotificationContext";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Mic, Trash2, Video } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, chatApi } from "@/lib/api";

interface ChatMessage {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  sender: {
    name: string;
    profilePictureUrl?: string;
  };
  voiceNoteUrl?: string;
}

interface BookingParticipant {
  id: number;
  name: string;
  profilePictureUrl?: string;
}

interface BookingDetails {
  id: number;
  customer: BookingParticipant;
  provider: BookingParticipant;
}

export default function ChatPage() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const bookingId = params.id;

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  const [otherUserIsOnline, setOtherUserIsOnline] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);

  const qc = useQueryClient();

  const { addNotification } = useNotification();

  const { data: booking, isLoading: isLoadingBooking } = useQuery<BookingDetails | null>({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingId ? bookingsApi.getById(parseInt(bookingId)) : null,
    enabled: !!bookingId,
  });

  const { data: chatHistory = [], isLoading: isLoadingHistory } = useQuery<ChatMessage[]>({
    queryKey: ["chat", bookingId],
    queryFn: () => bookingId ? chatApi.getMessages(parseInt(bookingId)) : [],
    enabled: !!bookingId,
    placeholderData: [], // Start with an empty array
  });

  const otherUser = booking
    ? (user?.id === booking.customer.id ? booking.provider : booking.customer)
    : null;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!bookingId) return;

    // Your existing WebSocket connection logic
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws/${bookingId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Chat WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'typing_start') {
        setOtherUserIsTyping(true);
      } else if (data.type === 'typing_stop') {
        setOtherUserIsTyping(false);
      } else if (data.type === 'presence_update') {
        setOtherUserIsOnline(data.status === 'online');
      } else {
        // It's a regular chat message
        const incomingMessage: ChatMessage = data;
        setOtherUserIsTyping(false); // Stop typing indicator when a message is received
        qc.setQueryData(['chat', bookingId], (oldData: ChatMessage[] | undefined) => {
          return oldData ? [...oldData, incomingMessage] : [incomingMessage];
        });

        // Your existing notification logic
        if (incomingMessage.senderId !== user?.id) {
        addNotification({
          title: `New message from ${incomingMessage.sender.name}`,
          message: incomingMessage.content,
          avatarUrl: incomingMessage.sender.profilePictureUrl,
        });
      }
    };
    }

    ws.onclose = () => {
      console.log("Chat WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [bookingId, user?.id, addNotification, qc]);

  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", bookingId] }),
    onError: (err) => console.error("Failed to send message:", err),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: chatApi.deleteMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", bookingId] }),
    onError: (err) => console.error("Failed to delete message:", err),
  });

  const sendVoiceNoteMutation = useMutation({
    mutationFn: chatApi.sendVoiceNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", bookingId] }),
    onError: (err) => console.error("Failed to send voice note:", err),
  });

  const handleSendMessage = () => {
    if (message.trim() && bookingId) {
      // Stop sending "typing" events
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const ws = (qc.getQueryData(['ws', bookingId]) as WebSocket | undefined);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'typing_stop' }));
      }
      sendMessageMutation.mutate({ bookingId: parseInt(bookingId), content: message });
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (bookingId) {
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            formData.append("voiceNote", audioBlob, "voice-note.webm");
            sendVoiceNoteMutation.mutate(formData);
          }
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please check permissions.");
      }
    } else {
      alert("Your browser does not support audio recording.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const VoiceNotePlayer = ({ url }: { url: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={togglePlay} className="btn-boafo btn-sm">{isPlaying ? 'Pause' : 'Play'}</button>
        <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} />
        <span>Voice Note</span>
      </div>
    );
  };

  function onEmojiClick(emojiData: EmojiClickData) {
    setMessage(prev => prev + emojiData.emoji);
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    const ws = (qc.getQueryData(['ws', bookingId]) as WebSocket | undefined);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Send typing_start if not already sent in the last few seconds
    if (!typingTimeoutRef.current) {
      ws.send(JSON.stringify({ type: 'typing_start' }));
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing_stop after a delay
    typingTimeoutRef.current = setTimeout(() => {
      ws.send(JSON.stringify({ type: 'typing_stop' }));
      typingTimeoutRef.current = null;
    }, 3000); // 3 seconds
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FFF8EE' }}>
      {/* Chat Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: '#F5EDD8',
        borderBottom: '1px solid #E8D9BF',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/dashboard">
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#473C33' }}>←</button>
        </Link>
        {isLoadingBooking ? <div style={{color: '#6B5B4E'}}>Loading...</div> : otherUser ? (
          <>
            <img src={otherUser.profilePictureUrl || '/images/default-avatar.png'} alt={otherUser.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#473C33' }}>{otherUser.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B5B4E', height: '1.2em' }}>
                {otherUserIsTyping ? <span className="typing-indicator">typing...</span> : otherUserIsOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </>
        ) : null}
        {/* Video Call Button for Gold/Diamond plans */}
        {(user?.plan === 'Gold' || user?.plan === 'Diamond') && (
          <button title="Start Video Call" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#473C33' }}>
            <Video size={24} />
          </button>
        )}
      </header>

      {/* Chat Messages Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column-reverse' }}>
        {isLoadingHistory && <div style={{ textAlign: 'center', color: '#6B5B4E' }}>Loading history...</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...chatHistory].reverse().map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className="chat-message-container" style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div className="chat-bubble" style={{
                  background: isMe ? '#ABC270' : '#FFFFFF',
                  color: isMe ? '#FFFFFF' : '#473C33',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '0' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '0',
                  maxWidth: '75%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}>
                  {msg.voiceNoteUrl ? (
                    <VoiceNotePlayer url={msg.voiceNoteUrl} />
                  ) : (
                    <div>{msg.content}</div>
                  )}
                  <div style={{
                    fontSize: '0.7rem',
                    textAlign: 'right',
                    marginTop: '0.25rem',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <span>{msg.timestamp}</span>
                    {isMe && (
                      <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, opacity: 0.6 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Message Input */}
      <footer style={{ padding: '0.5rem 1rem', background: '#F5EDD8', borderTop: '1px solid #E8D9BF', position: 'sticky', bottom: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showEmojiPicker && (
            <div style={{ position: 'absolute', bottom: '120%', right: 0, zIndex: 10 }}>
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <button onClick={() => setShowEmojiPicker(p => !p)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6B5B4E' }}>
            😊
          </button>
          {isRecording ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#C0392B' }}>Recording...</span>
              <button className="btn-boafo btn-danger" onClick={handleStopRecording}>Stop & Send</button>
            </div>
          ) : (
            <>
              <input
                className="boafo-input"
                style={{ flex: 1, background: '#fff' }}
                placeholder="Type a message..."
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button title="Send Voice Note" onClick={handleStartRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#473C33' }}><Mic size={24} /></button>
              <button className="btn-boafo btn-primary" onClick={handleSendMessage}>Send</button>
            </>
          )}
        </div>
      </footer>
      </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { directChatApi, getToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Send, ArrowLeft } from "lucide-react";

interface Msg {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function DirectChat() {
  const { chatId } = useParams<{ chatId: string }>();
  const id = parseInt(chatId);
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history = [] } = useQuery<Msg[]>({
    queryKey: ["direct-messages", id],
    queryFn: () => directChatApi.getMessages(id),
    enabled: !!id,
  });

  useEffect(() => { setMsgs(history as Msg[]); }, [history]);

  useEffect(() => {
    if (!id) return;
    const token = getToken() || "";
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}/api/direct/ws/${id}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try { setMsgs(prev => [...prev, JSON.parse(e.data)]); } catch {}
    };
    return () => ws.close();
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    const content = text.trim();
    if (!content || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
    setText("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "rgba(255,248,238,0.97)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => history.length >= 0 && window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#473C33", display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, color: "#473C33", fontSize: "1rem" }}>Chat</span>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {msgs.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id ?? i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "72%", padding: "0.6rem 0.9rem", borderRadius: 14,
                borderTopRightRadius: isMe ? 2 : 14, borderTopLeftRadius: isMe ? 14 : 2,
                background: isMe ? "#ABC270" : "#fff",
                color: isMe ? "#fff" : "#473C33",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)", fontSize: "0.9rem", lineHeight: 1.5,
              }}>
                {!isMe && <div style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.2rem", opacity: 0.7 }}>{msg.senderName}</div>}
                {msg.content}
                <div style={{ fontSize: "0.68rem", opacity: 0.6, textAlign: "right", marginTop: "0.2rem" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <footer style={{ padding: "0.75rem 1rem", background: "#F5EDD8", borderTop: "1px solid #E8D9BF", display: "flex", gap: "0.5rem" }}>
        <input
          className="boafo-input"
          style={{ flex: 1, background: "#fff" }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button className="btn-boafo btn-primary" style={{ padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.375rem" }} onClick={send}>
          <Send size={15} />
        </button>
      </footer>
    </div>
  );
}

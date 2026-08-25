import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatBoxProps {
  bookingId: number;
  otherUserName?: string;
}

export function ChatBox({ bookingId, otherUserName = "Provider" }: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = trpc.chat.getMessages.useQuery({ bookingId });
  const sendMessage = trpc.chat.sendMessage.useMutation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
              await sendMessage.mutateAsync({
                bookingId,
                recipientId: 0, // TODO: Get actual recipient ID from booking
                message: message,
              });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col h-96">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-32" />
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-96 bg-card border border-border/20">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <h3 className="font-semibold text-foreground">Chat with {otherUserName}</h3>
        <p className="text-xs text-muted-foreground">Job discussion</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.isOwn
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/20 flex gap-2">
        <Input
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isSubmitting || !message.trim()}
          className="btn-cinematic"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </Card>
  );
}

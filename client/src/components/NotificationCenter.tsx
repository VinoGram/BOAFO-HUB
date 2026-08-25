import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, AlertCircle, MessageSquare, Clock, X } from "lucide-react";
import { toast } from "sonner";

export function NotificationCenter() {
  const { data: unread } = trpc.notifications.getUnread.useQuery();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({
    limit: 20,
    offset: 0,
  });
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead.mutateAsync({ notificationId });
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_request":
        return <Clock className="w-4 h-4 text-accent" />;
      case "booking_confirmed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "booking_declined":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "job_completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "new_message":
        return <MessageSquare className="w-4 h-4 text-accent" />;
      case "new_review":
        return <Badge className="w-4 h-4 text-yellow-400" />;
      case "verification_approved":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "verification_rejected":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "booking_request":
      case "new_message":
        return "bg-accent/10";
      case "booking_confirmed":
      case "job_completed":
      case "verification_approved":
        return "bg-green-500/10";
      case "booking_declined":
      case "verification_rejected":
        return "bg-destructive/10";
      default:
        return "bg-muted/10";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unread && unread.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unread.length > 9 ? "9+" : unread.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            {unread?.length || 0} unread
          </p>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>Loading notifications...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notif.isRead ? getNotificationColor(notif.type) : ""
                  }`}
                  onClick={() => {
                    if (!notif.isRead) {
                      handleMarkAsRead(notif.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

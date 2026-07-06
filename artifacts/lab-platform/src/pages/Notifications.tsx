import { useState } from "react";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck, Calendar, Wrench, Share2, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NotificationIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    BOOKING_APPROVED: <CheckCheck className="h-4 w-4 text-green-600" />,
    BOOKING_PENDING: <Calendar className="h-4 w-4 text-amber-600" />,
    BOOKING_CANCELLED: <Calendar className="h-4 w-4 text-red-600" />,
    MAINTENANCE_SCHEDULED: <Wrench className="h-4 w-4 text-blue-600" />,
    SHARING_REQUEST: <Share2 className="h-4 w-4 text-purple-600" />,
    ALERT: <AlertTriangle className="h-4 w-4 text-red-600" />,
  };
  return <span>{icons[type] ?? <Info className="h-4 w-4 text-muted-foreground" />}</span>;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data: allNotifications, isLoading } = useListNotifications({});
  const { data: unreadNotifications } = useListNotifications({ unreadOnly: true });

  const markRead = useMarkNotificationRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) },
  });
  const markAllRead = useMarkAllNotificationsRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) },
  });

  const notifications = tab === "unread" ? (unreadNotifications ?? []) : (allNotifications ?? []);
  const unreadCount = (unreadNotifications ?? []).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-muted-foreground text-sm">{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-3.5 w-3.5" />Mark all read
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread {unreadCount > 0 && <Badge className="h-4 min-w-4 text-[10px] px-1 bg-primary">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{tab === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {notifications.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.03 }}>
                    <Card className={`transition-all cursor-pointer hover:shadow-sm ${!n.isRead ? "bg-primary/3 border-primary/20" : ""}`} onClick={() => !n.isRead && markRead.mutate({ notificationId: n.id })}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-muted/60">
                            <NotificationIcon type={n.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

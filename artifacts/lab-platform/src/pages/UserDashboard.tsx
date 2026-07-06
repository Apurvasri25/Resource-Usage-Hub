import { Link } from "wouter";
import { useListBookings, useListEquipment, useListNotifications, useListMaintenanceRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CalendarDays, Microscope, Bell, Plus, ArrowRight,
  CheckCircle, Clock, MapPin, Wrench
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { motion } from "framer-motion";

export default function UserDashboard() {
  const { user, isLoading: userLoading } = useCurrentUser();

  const { data: myBookings, isLoading: bookingsLoading } = useListBookings({});
  const { data: availableEquipment } = useListEquipment({ status: "AVAILABLE" });
  const { data: notifications } = useListNotifications({ unreadOnly: true });
  const { data: maintenanceList } = useListMaintenanceRecords({});

  const upcoming = (myBookings ?? [])
    .filter(b => (b.status === "CONFIRMED" || b.status === "PENDING_APPROVAL") && isAfter(new Date(b.endTime), new Date()))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const unreadCount = (notifications ?? []).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const ROLE_LABEL: Record<string, string> = {
    RESEARCHER: "Researcher",
    LAB_TECHNICIAN: "Lab Technician",
    LAB_MANAGER: "Lab Manager",
    DEPT_HEAD: "Department Head",
  };

  if (userLoading || bookingsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" /><Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}, {user?.firstName || "there"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? ""}
            {user?.role ? " · " : ""}
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <Link href="/bookings/new">
          <Button className="gap-1.5"><Plus className="h-4 w-4" />New Booking</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <CalendarDays className="h-4 w-4" />My Bookings
            </div>
            <div className="text-3xl font-bold">{upcoming.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Upcoming reservations</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <Microscope className="h-4 w-4" />Available
            </div>
            <div className="text-3xl font-bold text-green-600">{(availableEquipment ?? []).length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Equipment ready to book</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${unreadCount > 0 ? "border-l-amber-500" : "border-l-muted"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <Bell className="h-4 w-4" />Notifications
            </div>
            <div className={`text-3xl font-bold ${unreadCount > 0 ? "text-amber-600" : ""}`}>{unreadCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Unread alerts</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Upcoming Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Upcoming Bookings</CardTitle>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">All bookings <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <CardDescription>Confirmed and pending reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                <Link href="/bookings/new">
                  <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" />Book equipment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(b => (
                  <div key={b.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{(b as any).equipmentName ?? `Equipment #${b.equipmentId}`}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(b.startTime), "MMM d, h:mm a")} – {format(new Date(b.endTime), "h:mm a")}
                      </div>
                      {b.purpose && <div className="text-xs text-muted-foreground truncate mt-0.5">{b.purpose}</div>}
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Available to Book</CardTitle>
              <Link href="/equipment">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Browse all <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <CardDescription>Equipment ready for reservation</CardDescription>
          </CardHeader>
          <CardContent>
            {(availableEquipment ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No equipment currently available</div>
            ) : (
              <div className="space-y-3">
                {(availableEquipment ?? []).slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{e.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        {e.location && <><MapPin className="h-3 w-3" />{e.location}</>}
                        {e.dailyRate != null && <span className="ml-2">${e.dailyRate}/day</span>}
                      </div>
                    </div>
                    <Link href={`/bookings/new?equipmentId=${e.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">Book</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications panel */}
      {unreadCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                {unreadCount} Unread Notification{unreadCount !== 1 ? "s" : ""}
              </CardTitle>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(notifications ?? []).slice(0, 3).map(n => (
                <div key={n.id} className="flex items-start gap-3 bg-white rounded-md px-3 py-2 border">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Technician extra: maintenance */}
      {(user?.role === "LAB_TECHNICIAN" || user?.role === "LAB_MANAGER") && (maintenanceList ?? []).filter(m => m.status === "SCHEDULED").length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-600" />My Maintenance Tasks
              </CardTitle>
              <Link href="/maintenance">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(maintenanceList ?? []).filter(m => m.status === "SCHEDULED").slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{(m as any).equipmentName ?? `Equipment #${m.equipmentId}`}</div>
                    <div className="text-xs text-muted-foreground">{m.type} · {m.scheduledDate}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

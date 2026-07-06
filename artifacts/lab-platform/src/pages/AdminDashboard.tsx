import { Link } from "wouter";
import { useGetDashboardStats, useListBookings, useListMaintenanceRecords, useListUsers, useApproveBooking, useRejectBooking, useUpdateMaintenanceRecord } from "@workspace/api-client-react";
import { getListBookingsQueryKey, getListMaintenanceRecordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Users, Microscope, CalendarDays, Wrench, Activity,
  CheckCircle, XCircle, ShieldCheck, AlertTriangle, Clock,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: pendingBookings } = useListBookings({ status: "PENDING_APPROVAL" });
  const { data: maintenanceRecords } = useListMaintenanceRecords({ status: "SCHEDULED" });
  const { data: users } = useListUsers();

  const approve = useApproveBooking({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) },
  });
  const reject = useRejectBooking({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) },
  });
  const startMaintenance = useUpdateMaintenanceRecord({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMaintenanceRecordsQueryKey() }) },
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin Console</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting()}, {user?.firstName || "Admin"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's your system overview for today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(new Date(), "EEEE, MMM d · h:mm a")}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <Microscope className="h-4 w-4" />Equipment
            </div>
            <div className="text-3xl font-bold">{stats?.totalEquipment ?? 0}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">{stats?.availableEquipment ?? 0} available</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${(stats?.pendingApprovals ?? 0) > 0 ? "border-l-amber-500" : "border-l-green-500"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <CalendarDays className="h-4 w-4" />Pending
            </div>
            <div className={`text-3xl font-bold ${(stats?.pendingApprovals ?? 0) > 0 ? "text-amber-600" : ""}`}>
              {stats?.pendingApprovals ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Bookings need approval</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <Users className="h-4 w-4" />Users
            </div>
            <div className="text-3xl font-bold">{(users ?? []).length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Registered accounts</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
              <Activity className="h-4 w-4" />Utilization
            </div>
            <div className="text-3xl font-bold">{stats?.averageUtilizationRate ?? 0}<span className="text-lg font-normal text-muted-foreground">%</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">Avg across all equipment</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pending Approvals
              </CardTitle>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">View all <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <CardDescription>Booking requests awaiting your decision</CardDescription>
          </CardHeader>
          <CardContent>
            {(pendingBookings ?? []).length === 0 ? (
              <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No pending approvals
              </div>
            ) : (
              <div className="space-y-3">
                {(pendingBookings ?? []).slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{(b as any).equipmentName ?? `Equipment #${b.equipmentId}`}</div>
                      <div className="text-xs text-muted-foreground">
                        {(b as any).userName ?? "Unknown"} · {format(new Date(b.startTime), "MMM d, h:mm a")}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50"
                        onClick={() => approve.mutate({ bookingId: b.id })} title="Approve">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50"
                        onClick={() => reject.mutate({ bookingId: b.id, data: { reason: "Declined by admin" } })} title="Reject">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Queue */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-500" />
                Maintenance Queue
              </CardTitle>
              <Link href="/maintenance">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Manage <ArrowRight className="h-3 w-3" /></Button>
              </Link>
            </div>
            <CardDescription>Scheduled work orders</CardDescription>
          </CardHeader>
          <CardContent>
            {(maintenanceRecords ?? []).length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No scheduled maintenance</div>
            ) : (
              <div className="space-y-3">
                {(maintenanceRecords ?? []).slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{(m as any).equipmentName ?? `Equipment #${m.equipmentId}`}</div>
                      <div className="text-xs text-muted-foreground">{m.type} · {m.scheduledDate}</div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                      onClick={() => startMaintenance.mutate({ maintenanceId: m.id, data: { status: "IN_PROGRESS" } })}>
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <CardDescription>Latest activity across the facility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentBookings ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent bookings</div>
              ) : (
                (stats?.recentBookings ?? []).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-sm">{booking.equipmentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.userName} · {format(new Date(booking.startTime), "MMM d, h:mm a")}
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Admin Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/admin", label: "User Management", icon: Users, desc: "Roles & permissions" },
              { href: "/analytics", label: "Analytics", icon: Activity, desc: "Usage & cost reports" },
              { href: "/utilization", label: "Utilization", icon: Activity, desc: "Heatmap & idle alerts" },
              { href: "/sharing", label: "Sharing", icon: CheckCircle, desc: "Inter-institution agreements" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors group">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

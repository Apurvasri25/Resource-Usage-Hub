import { useState } from "react";
import { Link } from "wouter";
import { useListBookings, useApproveBooking, useRejectBooking, useCancelBooking } from "@workspace/api-client-react";
import { getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Ban, Plus, Search, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const params = statusFilter !== "all" ? { status: statusFilter as any } : {};
  const { data: bookings, isLoading } = useListBookings(params);

  const approve = useApproveBooking({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) } });
  const reject = useRejectBooking({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) } });
  const cancel = useCancelBooking({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() }) } });

  const filtered = (bookings ?? []).filter(b =>
    search === "" ||
    (b as any).equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
    (b as any).userName?.toLowerCase().includes(search.toLowerCase()) ||
    b.purpose?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = (bookings ?? []).filter(b => b.status === "PENDING_APPROVAL").length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage equipment reservations and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200">{pendingCount} pending approval</Badge>}
          <Link href="/bookings/new"><Button size="sm" className="bg-primary gap-1"><Plus className="h-4 w-4" />New Booking</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: (bookings ?? []).length, color: "text-foreground" },
          { label: "Pending", value: (bookings ?? []).filter(b => b.status === "PENDING_APPROVAL").length, color: "text-amber-600" },
          { label: "Confirmed", value: (bookings ?? []).filter(b => b.status === "CONFIRMED" || b.status === "IN_USE").length, color: "text-green-600" },
          { label: "Completed", value: (bookings ?? []).filter(b => b.status === "COMPLETED").length, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="text-center py-1">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by equipment, user, or purpose..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="IN_USE">In Use</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No bookings found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{(b as any).equipmentName ?? `Equipment #${b.equipmentId}`}</span>
                        <StatusBadge status={b.status} />
                        {b.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(b.startTime).toLocaleDateString()} — {new Date(b.endTime).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000)}h</span>
                        {(b as any).userName && <span>· {(b as any).userName}</span>}
                      </div>
                      {b.purpose && <div className="text-xs text-muted-foreground mt-1 truncate">Purpose: {b.purpose}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {b.totalCost != null && <span className="text-sm font-medium">${b.totalCost}</span>}
                      {b.status === "PENDING_APPROVAL" && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={() => approve.mutate({ bookingId: b.id })} title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => reject.mutate({ bookingId: b.id, data: { reason: "Declined" } })} title="Reject">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(b.status === "PENDING_APPROVAL" || b.status === "CONFIRMED") && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-red-50" onClick={() => cancel.mutate({ bookingId: b.id })} title="Cancel">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

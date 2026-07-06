import { useState } from "react";
import { useListMaintenanceRecords, useGetUpcomingMaintenance, useUpdateMaintenanceRecord, useCreateMaintenanceRecord, useListEquipment } from "@workspace/api-client-react";
import { getListMaintenanceRecordsQueryKey, getGetUpcomingMaintenanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wrench, AlertTriangle, Plus, CheckCircle, Loader2, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_COLORS: Record<string, string> = {
  PREVENTIVE: "text-blue-600 bg-blue-50 border-blue-200",
  CORRECTIVE: "text-red-600 bg-red-50 border-red-200",
  CALIBRATION: "text-purple-600 bg-purple-50 border-purple-200",
  INSPECTION: "text-teal-600 bg-teal-50 border-teal-200",
};

export default function Maintenance() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ equipmentId: "", type: "PREVENTIVE" as any, scheduledDate: "", description: "", cost: "" });
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useListMaintenanceRecords(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );
  const { data: upcoming } = useGetUpcomingMaintenance({ days: 30 });
  const { data: equipment } = useListEquipment();

  const createRecord = useCreateMaintenanceRecord({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaintenanceRecordsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingMaintenanceQueryKey() });
        setCreating(false);
        setForm({ equipmentId: "", type: "PREVENTIVE", scheduledDate: "", description: "", cost: "" });
      },
    },
  });

  const updateRecord = useUpdateMaintenanceRecord({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMaintenanceRecordsQueryKey() }) },
  });

  const scheduledCount = (records ?? []).filter(r => r.status === "SCHEDULED").length;
  const inProgressCount = (records ?? []).filter(r => r.status === "IN_PROGRESS").length;
  const overdueCount = (upcoming ?? []).filter(r => new Date(r.scheduledDate) < new Date()).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Work orders, calibration schedules, and service history</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary gap-1"><Plus className="h-4 w-4" />Schedule Maintenance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Equipment</Label>
                <Select value={form.equipmentId} onValueChange={v => setForm(f => ({ ...f, equipmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{(equipment ?? []).map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                    <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                    <SelectItem value="CALIBRATION">Calibration</SelectItem>
                    <SelectItem value="INSPECTION">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled Date</Label>
                <Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the maintenance task" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Cost ($)</Label>
                <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" />
              </div>
              <Button className="w-full" disabled={createRecord.isPending || !form.equipmentId || !form.scheduledDate} onClick={() => createRecord.mutate({ data: { equipmentId: Number(form.equipmentId), type: form.type, scheduledDate: form.scheduledDate, description: form.description, cost: form.cost ? Number(form.cost) : undefined } })}>
                {createRecord.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Scheduled", value: scheduledCount, color: "text-blue-600" },
          { label: "In Progress", value: inProgressCount, color: "text-amber-600" },
          { label: "Upcoming (30d)", value: (upcoming ?? []).length, color: "text-primary" },
          { label: "Overdue", value: overdueCount, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(upcoming ?? []).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700"><CalendarDays className="h-4 w-4" />Upcoming in Next 30 Days</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(upcoming ?? []).slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-white border rounded-md px-3 py-2">
                  <div>
                    <span className="font-medium">{(r as any).equipmentName ?? `Equipment #${r.equipmentId}`}</span>
                    <span className="text-muted-foreground ml-2">· {r.scheduledDate}</span>
                  </div>
                  <Badge className={`text-xs ${TYPE_COLORS[r.type] ?? ""}`}>{r.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (records ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No maintenance records found</div>
      ) : (
        <div className="space-y-2">
          {(records ?? []).map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{(r as any).equipmentName ?? `Equipment #${r.equipmentId}`}</span>
                        <Badge className={`text-xs ${TYPE_COLORS[r.type] ?? ""}`}>{r.type}</Badge>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Scheduled: {r.scheduledDate}
                        {(r as any).technicianName && <span> · Technician: {(r as any).technicianName}</span>}
                        {r.cost != null && <span> · Cost: ${r.cost}</span>}
                        {r.downtimeHours != null && <span> · {r.downtimeHours}h downtime</span>}
                      </div>
                      {r.description && <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>}
                    </div>
                    <div className="flex gap-2">
                      {r.status === "SCHEDULED" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateRecord.mutate({ maintenanceId: r.id, data: { status: "IN_PROGRESS" } })}>Start</Button>
                      )}
                      {r.status === "IN_PROGRESS" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-300" onClick={() => updateRecord.mutate({ maintenanceId: r.id, data: { status: "COMPLETED", completedDate: new Date().toISOString().split("T")[0] } })}>
                          <CheckCircle className="h-3 w-3 mr-1" />Complete
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

import { useParams, Link } from "wouter";
import { useGetEquipment, useGetEquipmentUtilizationStats, useListMaintenanceRecords, useListBookings, useUpdateEquipmentStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListEquipmentQueryKey, getGetEquipmentQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Wrench, CalendarDays, DollarSign, MapPin, Tag, Activity, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EquipmentDetail() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data: equipment, isLoading } = useGetEquipment(id, { query: { enabled: !!id, queryKey: getGetEquipmentQueryKey(id) } });
  const { data: stats } = useGetEquipmentUtilizationStats({ equipmentId: id }, { query: { enabled: !!id } });
  const { data: maintenanceRecords } = useListMaintenanceRecords({ equipmentId: id }, { query: { enabled: !!id } });
  const { data: bookings } = useListBookings({ equipmentId: id }, { query: { enabled: !!id } });

  const updateStatus = useUpdateEquipmentStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEquipmentQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Equipment not found</p>
        <Link href="/equipment"><Button variant="outline" className="mt-4">Back to Inventory</Button></Link>
      </div>
    );
  }

  const recentBookings = (bookings ?? []).slice(0, 5);
  const bookingChartData = [
    { month: "Jan", hours: 45 }, { month: "Feb", hours: 62 }, { month: "Mar", hours: 38 },
    { month: "Apr", hours: 71 }, { month: "May", hours: 55 }, { month: "Jun", hours: 80 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/equipment">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{equipment.name}</h1>
          <p className="text-muted-foreground text-sm">{equipment.model} {equipment.serialNumber ? `· ${equipment.serialNumber}` : ""}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={equipment.status} />
          <Select
            value={equipment.status}
            onValueChange={(value) => updateStatus.mutate({ equipmentId: id, data: { status: value as any } })}
          >
            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Set Available</SelectItem>
              <SelectItem value="UNDER_MAINTENANCE">Set Maintenance</SelectItem>
              <SelectItem value="OUT_OF_SERVICE">Set Out of Service</SelectItem>
              <SelectItem value="RETIRED">Set Retired</SelectItem>
            </SelectContent>
          </Select>
          <Link href={`/bookings/new?equipmentId=${id}`}>
            <Button size="sm" className="bg-primary">Book Equipment</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{equipment.location ?? "No location set"}</span></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Tag className="h-4 w-4" /><span>{(equipment as any).categoryName ?? "Uncategorized"} · {(equipment as any).departmentName ?? "Unassigned"}</span></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" /><span>${equipment.dailyRate ?? "—"}/day</span></div>
            {equipment.isShared && <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Available for Sharing</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Utilization Rate</div>
            <div className="text-3xl font-bold text-primary">{stats?.utilizationRate ?? 0}<span className="text-base font-normal text-muted-foreground">%</span></div>
            <div className="text-xs text-muted-foreground mt-1">{stats?.totalHoursUsed ?? 0}h used · {stats?.bookingCount ?? 0} bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Calibration</div>
            <div className="text-sm"><span className="text-muted-foreground">Last: </span>{equipment.lastCalibrationDate ?? "N/A"}</div>
            <div className="text-sm"><span className="text-muted-foreground">Next: </span><span className={equipment.nextCalibrationDate ? "text-amber-600 font-medium" : ""}>{equipment.nextCalibrationDate ?? "N/A"}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Usage History (Hours)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bookingChartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center justify-between">Recent Bookings <Link href="/bookings"><span className="text-xs text-primary font-normal cursor-pointer">View all</span></Link></CardTitle></CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{(b as any).userName ?? "Unknown user"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.startTime).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Wrench className="h-4 w-4" />Maintenance Records</CardTitle></CardHeader>
        <CardContent>
          {!maintenanceRecords || maintenanceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No maintenance records</p>
          ) : (
            <div className="space-y-2">
              {maintenanceRecords.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{m.type} — {m.description ?? "No description"}</div>
                    <div className="text-xs text-muted-foreground">{m.scheduledDate}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {equipment.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{equipment.description}</p></CardContent>
        </Card>
      )}
    </motion.div>
  );
}

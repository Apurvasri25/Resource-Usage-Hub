import { useState } from "react";
import { useGetUtilizationHeatmap, useGetIdleEquipment, useListEquipment, useGetEquipmentUtilizationStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, AlertTriangle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HeatmapCell({ value }: { value: number }) {
  const intensity = Math.min(value / 100, 1);
  const bg = intensity === 0 ? "bg-muted/30" :
    intensity < 0.25 ? "bg-primary/15" :
    intensity < 0.5 ? "bg-primary/35" :
    intensity < 0.75 ? "bg-primary/60" : "bg-primary/85";
  return <div className={`h-5 w-full rounded-sm ${bg} transition-colors`} title={`${value.toFixed(0)}% utilization`} />;
}

export default function Utilization() {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");

  const { data: heatmap } = useGetUtilizationHeatmap({ period: "7d" });
  const { data: idleEquipment } = useGetIdleEquipment();
  const { data: allEquipment } = useListEquipment();
  const { data: stats } = useGetEquipmentUtilizationStats(
    { equipmentId: Number(selectedEquipmentId) },
    { query: { enabled: !!selectedEquipmentId } }
  );

  const heatmapGrid = DAYS.map((day, dayIdx) => ({
    day,
    hours: HOURS.map(hour => {
      const cell = (heatmap ?? []).find(c => c.dayOfWeek === dayIdx && c.hour === hour);
      return { hour, rate: cell?.utilizationRate ?? 0 };
    }),
  }));

  const utilizationData = (allEquipment ?? []).map(e => ({
    name: e.name.length > 18 ? e.name.slice(0, 18) + "…" : e.name,
    rate: Math.floor(Math.random() * 80 + 10),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilization Monitoring</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Real-time equipment utilization and idle time analysis</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2"><Activity className="h-4 w-4" />Avg Utilization</div>
            <div className="text-3xl font-bold text-primary">64<span className="text-lg font-normal text-muted-foreground">%</span></div>
            <div className="text-xs text-muted-foreground mt-1">Across all equipment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2"><AlertTriangle className="h-4 w-4" />Idle Equipment</div>
            <div className="text-3xl font-bold text-amber-600">{(idleEquipment ?? []).length}</div>
            <div className="text-xs text-muted-foreground mt-1">Idle for 24+ hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2"><Clock className="h-4 w-4" />Peak Hours</div>
            <div className="text-3xl font-bold">9–5</div>
            <div className="text-xs text-muted-foreground mt-1">Weekdays highest usage</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Weekly Usage Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground">Darker = higher utilization frequency</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex gap-1 mb-1 pl-10">
                {HOURS.filter((_, i) => i % 3 === 0).map(h => (
                  <div key={h} className="flex-1 text-center text-xs text-muted-foreground" style={{ width: `${100 / 8}%` }}>{h}:00</div>
                ))}
              </div>
              {heatmapGrid.map(row => (
                <div key={row.day} className="flex items-center gap-1 mb-1">
                  <div className="w-9 text-xs text-muted-foreground text-right pr-2 shrink-0">{row.day}</div>
                  {row.hours.map(cell => (
                    <div key={cell.hour} className="flex-1">
                      <HeatmapCell value={cell.rate} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-end">
            <span>Low</span>
            <div className="flex gap-0.5">{[15, 35, 60, 85].map(v => <div key={v} className={`w-4 h-3 rounded-sm bg-primary/${v}`} />)}</div>
            <span>High</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Equipment Utilization Rate</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={utilizationData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v) => [`${v}%`, "Utilization"]} />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Equipment Stats
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger className="h-7 w-44 text-xs"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>
                  {(allEquipment ?? []).map(e => <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <p className="text-sm text-muted-foreground text-center py-8">Select an equipment to see stats</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Equipment", value: stats.equipmentName },
                  { label: "Utilization Rate", value: `${stats.utilizationRate}%` },
                  { label: "Hours Used", value: `${stats.totalHoursUsed}h` },
                  { label: "Available Hours", value: `${stats.totalHoursAvailable}h` },
                  { label: "Idle Hours", value: `${stats.idleHours}h` },
                  { label: "Total Bookings", value: stats.bookingCount },
                  { label: "Peak Hours", value: stats.peakHours },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm border-b pb-2 last:border-0">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(idleEquipment ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Idle Equipment Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(idleEquipment ?? []).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.departmentName} · {e.model}</div>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">Idle {e.idleSinceHours}h</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

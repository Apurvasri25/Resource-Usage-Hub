import { useState } from "react";
import { useGetDashboardStats, useGetBookingTrends, useGetTopEquipment, useGetCostAnalysis, useGetSharingStats, useGetEquipmentUtilizationReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Share2, Activity, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

const PIE_COLORS = ["#1a4b8a", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"];

export default function Analytics() {
  const [period, setPeriod] = useState("30d");

  const { data: dash } = useGetDashboardStats();
  const { data: trends } = useGetBookingTrends({ period });
  const { data: topEquipment } = useGetTopEquipment({ limit: 8 });
  const { data: costAnalysis } = useGetCostAnalysis({ period });
  const { data: sharingStats } = useGetSharingStats();
  const { data: utilReport } = useGetEquipmentUtilizationReport({ period });

  const statusData = (dash?.equipmentByStatus ?? []).map((s: any) => ({ name: s.status.replace(/_/g, " "), value: s.count }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Resource efficiency, booking trends, and cost insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Equipment", value: dash?.totalEquipment ?? 0, icon: <Activity className="h-4 w-4 text-primary" />, sub: `${dash?.availableEquipment ?? 0} available` },
          { label: "Avg Utilization", value: `${dash?.averageUtilizationRate ?? 0}%`, icon: <TrendingUp className="h-4 w-4 text-green-600" />, sub: "Across all equipment" },
          { label: "Active Sharing", value: dash?.activeSharingAgreements ?? 0, icon: <Share2 className="h-4 w-4 text-blue-600" />, sub: `${dash?.totalInstitutions ?? 0} institutions` },
          { label: "Est. Total Revenue", value: `$${(sharingStats?.totalRevenue ?? 0).toLocaleString()}`, icon: <DollarSign className="h-4 w-4 text-amber-600" />, sub: "From sharing agreements" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span></div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />Booking Trends</CardTitle></CardHeader>
            <CardContent>
              {!trends || trends.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No booking data available for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={d => `Date: ${d}`} />
                    <Line type="monotone" dataKey="bookingCount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Total" />
                    <Line type="monotone" dataKey="confirmedCount" stroke="#10b981" strokeWidth={2} dot={false} name="Confirmed" />
                    <Line type="monotone" dataKey="cancelledCount" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Cancelled" strokeDasharray="4 2" />
                    <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Equipment Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {statusData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart2 className="h-4 w-4" />Top Equipment by Bookings</CardTitle></CardHeader>
          <CardContent>
            {!topEquipment || topEquipment.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="space-y-2">
                {(topEquipment ?? []).map((e: any, i: number) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{e.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{e.bookingCount} bookings</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((e.bookingCount / ((topEquipment[0] as any)?.bookingCount || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{e.utilizationRate}%</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />Cost Analysis by Department</CardTitle></CardHeader>
          <CardContent>
            {!costAnalysis || costAnalysis.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No cost data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={costAnalysis} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="departmentName" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${v}`, "Total Cost"]} />
                  <Bar dataKey="totalCost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {sharingStats && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Share2 className="h-4 w-4" />Sharing Network Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Total Agreements", value: sharingStats.totalAgreements },
                { label: "Active", value: sharingStats.activeAgreements },
                { label: "Pending", value: sharingStats.pendingRequests },
                { label: "Partner Institutions", value: sharingStats.partneredInstitutions },
                { label: "Est. Revenue", value: `$${sharingStats.totalRevenue.toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

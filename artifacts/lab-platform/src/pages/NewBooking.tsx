import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateBooking, useListEquipment, useGetEquipmentAvailability } from "@workspace/api-client-react";
import { getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function NewBooking() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const preselectedId = search.get("equipmentId") ?? "";

  const [equipmentId, setEquipmentId] = useState(preselectedId);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState("");

  const { data: equipment } = useListEquipment({ status: "AVAILABLE" });
  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        setLocation("/bookings");
      },
      onError: (e: any) => setError(e?.message ?? "Failed to create booking"),
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!equipmentId || !startDate || !endDate) { setError("Please fill in all required fields"); return; }
    const startISO = `${startDate}T${startTime}:00.000Z`;
    const endISO = `${endDate}T${endTime}:00.000Z`;
    if (new Date(endISO) <= new Date(startISO)) { setError("End time must be after start time"); return; }
    createBooking.mutate({ data: { equipmentId: Number(equipmentId), startTime: startISO, endTime: endISO, purpose, notes, isRecurring } });
  }

  const selectedEquipment = (equipment ?? []).find(e => String(e.id) === equipmentId);
  const hours = startDate && endDate ? Math.max(0, (new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / 3600000) : 0;
  const estimatedCost = selectedEquipment?.dailyRate ? (hours / 24) * Number(selectedEquipment.dailyRate) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">New Booking</h1>
          <p className="text-muted-foreground text-sm">Request equipment reservation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Equipment Selection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Equipment <span className="text-red-500">*</span></Label>
              <Select value={equipmentId} onValueChange={setEquipmentId}>
                <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                <SelectContent>
                  {(equipment ?? []).map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} — {(e as any).departmentName ?? "Unknown dept"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEquipment && (
              <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                <div className="font-medium">{selectedEquipment.name}</div>
                <div className="text-muted-foreground">{selectedEquipment.model} · {selectedEquipment.location ?? "No location"}</div>
                {selectedEquipment.dailyRate && <div className="text-muted-foreground">${selectedEquipment.dailyRate}/day</div>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4" />Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            {hours > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
                <span className="font-medium">{hours.toFixed(1)} hours</span>
                {estimatedCost != null && <span className="text-muted-foreground"> · Estimated cost: <span className="font-medium text-foreground">${estimatedCost.toFixed(2)}</span></span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input placeholder="Brief description of intended use" value={purpose} onChange={e => setPurpose(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes or requirements" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded" />
              <span className="text-sm">Recurring booking</span>
            </label>
          </CardContent>
        </Card>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-3">
          <Link href="/bookings"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={createBooking.isPending} className="gap-1">
            {createBooking.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

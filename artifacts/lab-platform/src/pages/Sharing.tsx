import { useState } from "react";
import { useListSharingAgreements, useListSharedEquipment, useUpdateSharingAgreement, useCreateSharingAgreement, useListInstitutions, useListEquipment } from "@workspace/api-client-react";
import { getListSharingAgreementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, CheckCircle, XCircle, Share2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Sharing() {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ requestingInstitutionId: "", owningInstitutionId: "", equipmentId: "", dailyRate: "", startDate: "", endDate: "" });
  const queryClient = useQueryClient();

  const { data: agreements, isLoading } = useListSharingAgreements();
  const { data: sharedEquipment } = useListSharedEquipment();
  const { data: institutions } = useListInstitutions();
  const { data: equipment } = useListEquipment({ status: "AVAILABLE" });

  const updateAgreement = useUpdateSharingAgreement({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSharingAgreementsQueryKey() }) },
  });

  const createAgreement = useCreateSharingAgreement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSharingAgreementsQueryKey() });
        setCreating(false);
        setForm({ requestingInstitutionId: "", owningInstitutionId: "", equipmentId: "", dailyRate: "", startDate: "", endDate: "" });
      },
    },
  });

  const active = (agreements ?? []).filter(a => a.status === "APPROVED");
  const pending = (agreements ?? []).filter(a => a.status === "PENDING");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inter-Institution Sharing</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage cross-institution equipment sharing agreements</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary gap-1"><Plus className="h-4 w-4" />New Agreement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Sharing Agreement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Requesting Institution</Label>
                <Select value={form.requestingInstitutionId} onValueChange={v => setForm(f => ({ ...f, requestingInstitutionId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                  <SelectContent>{(institutions ?? []).map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owning Institution</Label>
                <Select value={form.owningInstitutionId} onValueChange={v => setForm(f => ({ ...f, owningInstitutionId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                  <SelectContent>{(institutions ?? []).map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Equipment</Label>
                <Select value={form.equipmentId} onValueChange={v => setForm(f => ({ ...f, equipmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{(equipment ?? []).map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Daily Rate ($)</Label>
                <Input type="number" value={form.dailyRate} onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))} placeholder="0.00" />
              </div>
              <Button className="w-full" disabled={createAgreement.isPending || !form.requestingInstitutionId || !form.owningInstitutionId || !form.equipmentId}
                onClick={() => createAgreement.mutate({ data: { requestingInstitutionId: Number(form.requestingInstitutionId), owningInstitutionId: Number(form.owningInstitutionId), equipmentId: Number(form.equipmentId), dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined, startDate: form.startDate || undefined, endDate: form.endDate || undefined } })}>
                {createAgreement.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Agreements", value: (agreements ?? []).length, color: "text-foreground" },
          { label: "Active", value: active.length, color: "text-green-600" },
          { label: "Pending", value: pending.length, color: "text-amber-600" },
          { label: "Shared Equipment", value: (sharedEquipment ?? []).length, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="agreements">
        <TabsList><TabsTrigger value="agreements">Agreements</TabsTrigger><TabsTrigger value="available">Available to Borrow</TabsTrigger></TabsList>

        <TabsContent value="agreements" className="mt-4 space-y-2">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : (agreements ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No sharing agreements yet</div>
          ) : (
            (agreements ?? []).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{(a as any).equipmentName ?? `Equipment #${a.equipmentId}`}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{(a as any).requestingInstitutionName ?? `Inst #${a.requestingInstitutionId}`} → {(a as any).owningInstitutionName ?? `Inst #${a.owningInstitutionId}`}</span>
                          {a.dailyRate != null && <span>${a.dailyRate}/day</span>}
                          {a.startDate && <span>{a.startDate} — {a.endDate ?? "Open"}</span>}
                        </div>
                      </div>
                      {a.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateAgreement.mutate({ agreementId: a.id, data: { status: "APPROVED" } })} title="Approve"><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateAgreement.mutate({ agreementId: a.id, data: { status: "REJECTED" } })} title="Reject"><XCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          {(sharedEquipment ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No shared equipment available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(sharedEquipment ?? []).map((e: any, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <Share2 className="h-5 w-5 text-primary mt-0.5" />
                        <StatusBadge status={e.status} />
                      </div>
                      <div className="font-semibold text-sm">{e.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{e.model}</div>
                      {e.institutionName && <div className="text-xs text-muted-foreground mt-1">{e.institutionName}</div>}
                      {e.dailyRate && <div className="text-sm font-medium text-primary mt-2">${e.dailyRate}/day</div>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

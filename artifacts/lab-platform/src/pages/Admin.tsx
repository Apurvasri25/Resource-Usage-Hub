import { useState } from "react";
import { useListUsers, useUpdateUserRole, useListInstitutions, useCreateInstitution, useListDepartments, useCreateDepartment } from "@workspace/api-client-react";
import { getListUsersQueryKey, getListInstitutionsQueryKey, getListDepartmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Building2, Plus, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  RESEARCHER: { label: "Researcher", color: "text-foreground bg-muted" },
  LAB_TECHNICIAN: { label: "Lab Technician", color: "text-blue-700 bg-blue-50 border-blue-200" },
  LAB_MANAGER: { label: "Lab Manager", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  DEPT_HEAD: { label: "Dept Head", color: "text-purple-700 bg-purple-50 border-purple-200" },
  INSTITUTION_ADMIN: { label: "Institution Admin", color: "text-teal-700 bg-teal-50 border-teal-200" },
  SYSTEM_ADMIN: { label: "System Admin", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function Admin() {
  const queryClient = useQueryClient();
  const [creatingInst, setCreatingInst] = useState(false);
  const [creatingDept, setCreatingDept] = useState(false);
  const [instForm, setInstForm] = useState({ name: "", type: "UNIVERSITY", address: "", contactEmail: "" });
  const [deptForm, setDeptForm] = useState({ name: "", institutionId: "" });

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: institutions } = useListInstitutions();
  const { data: departments } = useListDepartments();

  const updateRole = useUpdateUserRole({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }) },
  });

  const createInst = useCreateInstitution({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInstitutionsQueryKey() });
        setCreatingInst(false);
        setInstForm({ name: "", type: "UNIVERSITY", address: "", contactEmail: "" });
      },
    },
  });

  const createDept = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        setCreatingDept(false);
        setDeptForm({ name: "", institutionId: "" });
      },
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage users, institutions, and departments</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: (users ?? []).length, icon: <Users className="h-4 w-4" /> },
          { label: "Institutions", value: (institutions ?? []).length, icon: <Building2 className="h-4 w-4" /> },
          { label: "Departments", value: (departments ?? []).length, icon: <Building2 className="h-4 w-4" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">{s.icon}<span className="text-xs uppercase tracking-wide">{s.label}</span></div>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {usersLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : (
            <div className="space-y-2">
              {(users ?? []).map((u: any, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`text-xs ${ROLE_LABELS[u.role]?.color ?? "bg-muted"}`}>{ROLE_LABELS[u.role]?.label ?? u.role}</Badge>
                          <Select value={u.role} onValueChange={(role) => updateRole.mutate({ userId: u.id, data: { role: role as any } })}>
                            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
                                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="institutions" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={creatingInst} onOpenChange={setCreatingInst}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />Add Institution</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Institution</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={instForm.name} onChange={e => setInstForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={instForm.type} onValueChange={v => setInstForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNIVERSITY">University</SelectItem>
                        <SelectItem value="RESEARCH_CENTER">Research Center</SelectItem>
                        <SelectItem value="HOSPITAL">Hospital</SelectItem>
                        <SelectItem value="GOVERNMENT">Government Lab</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Address</Label><Input value={instForm.address} onChange={e => setInstForm(f => ({ ...f, address: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Contact Email</Label><Input type="email" value={instForm.contactEmail} onChange={e => setInstForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                  <Button className="w-full" disabled={createInst.isPending || !instForm.name} onClick={() => createInst.mutate({ data: { name: instForm.name, type: instForm.type, address: instForm.address || undefined, contactEmail: instForm.contactEmail || undefined } })}>
                    {createInst.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {(institutions ?? []).map((inst: any, i) => (
              <motion.div key={inst.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <CardContent className="pt-3 pb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{inst.name}</div>
                      <div className="text-xs text-muted-foreground">{inst.type} {inst.address ? `· ${inst.address}` : ""}</div>
                    </div>
                    {inst.contactEmail && <div className="text-xs text-muted-foreground">{inst.contactEmail}</div>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={creatingDept} onOpenChange={setCreatingDept}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />Add Department</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1.5">
                    <Label>Institution</Label>
                    <Select value={deptForm.institutionId} onValueChange={v => setDeptForm(f => ({ ...f, institutionId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                      <SelectContent>{(institutions ?? []).map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={createDept.isPending || !deptForm.name || !deptForm.institutionId} onClick={() => createDept.mutate({ data: { name: deptForm.name, institutionId: Number(deptForm.institutionId) } })}>
                    {createDept.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {(departments ?? []).map((dept: any, i) => {
              const inst = (institutions ?? []).find(x => x.id === dept.institutionId);
              return (
                <motion.div key={dept.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card>
                    <CardContent className="pt-3 pb-3 flex items-center justify-between">
                      <div className="text-sm font-medium">{dept.name}</div>
                      <Badge variant="outline" className="text-xs">{inst?.name ?? `Institution #${dept.institutionId}`}</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

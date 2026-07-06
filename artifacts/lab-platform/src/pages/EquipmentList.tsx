import { useState } from "react";
import { Link } from "wouter";
import { useListEquipment, useListEquipmentCategories } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Microscope, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EquipmentList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const { data: equipment, isLoading } = useListEquipment({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    categoryId: categoryFilter !== "ALL" ? Number(categoryFilter) : undefined,
  });

  const { data: categories } = useListEquipmentCategories();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Equipment Directory</h1>
          <p className="text-muted-foreground mt-1">Browse and manage laboratory instruments.</p>
        </div>
        <Button>Add Equipment</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, model, or serial number..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
            <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-32 bg-muted/50" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4 flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : equipment?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-white/50">
          <Filter className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No equipment found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">Try adjusting your search or filters to find what you're looking for.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setStatusFilter("ALL"); setCategoryFilter("ALL"); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment?.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-b">
                <Microscope className="h-12 w-12 text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg leading-tight truncate pr-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.model}</p>
                  </div>
                  <StatusBadge status={item.status} className="shrink-0" />
                </div>
                
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Department:</span>
                    <span className="text-foreground font-medium">{item.departmentName}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Category:</span>
                    <span className="text-foreground font-medium">{item.categoryName}</span>
                  </div>
                  {item.utilizationRate !== null && item.utilizationRate !== undefined && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Utilization:</span>
                      <span className="text-foreground font-medium">{Math.round(item.utilizationRate)}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t flex justify-end">
                  <Link href={`/equipment/${item.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

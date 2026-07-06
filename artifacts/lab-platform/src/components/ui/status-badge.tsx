import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
  let label = status;

  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "CONFIRMED":
    case "APPROVED":
      colorClass = "bg-green-100 text-green-800 border-green-200";
      break;
    case "BOOKED":
    case "IN_USE":
    case "IN_PROGRESS":
      colorClass = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "UNDER_MAINTENANCE":
    case "PENDING_APPROVAL":
    case "PENDING":
    case "SCHEDULED":
      colorClass = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case "OUT_OF_SERVICE":
    case "CANCELLED":
    case "NO_SHOW":
    case "REJECTED":
    case "EXPIRED":
      colorClass = "bg-red-100 text-red-800 border-red-200";
      break;
    case "RETIRED":
      colorClass = "bg-gray-100 text-gray-800 border-gray-200";
      break;
  }

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass, className)}>
      {label.replace(/_/g, " ")}
    </Badge>
  );
}

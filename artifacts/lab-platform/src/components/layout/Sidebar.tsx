import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  Microscope,
  CalendarDays,
  Activity,
  Wrench,
  Share2,
  Bell,
  Settings,
  BarChart3,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications } from "@workspace/api-client-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Badge } from "@/components/ui/badge";

const ADMIN_NAV = [
  { href: "/admin-dashboard", label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/equipment", label: "Equipment", icon: Microscope },
  { href: "/bookings", label: "All Bookings", icon: CalendarDays },
  { href: "/utilization", label: "Utilization", icon: Activity },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/sharing", label: "Sharing", icon: Share2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin", label: "User Management", icon: Users },
];

const MANAGER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/equipment", label: "Equipment", icon: Microscope },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/utilization", label: "Utilization", icon: Activity },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/sharing", label: "Sharing", icon: Share2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const USER_NAV = [
  { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/equipment", label: "Equipment", icon: Microscope },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays },
];

const ROLE_LABEL: Record<string, string> = {
  RESEARCHER: "Researcher",
  LAB_TECHNICIAN: "Lab Technician",
  LAB_MANAGER: "Lab Manager",
  DEPT_HEAD: "Dept Head",
  INSTITUTION_ADMIN: "Institution Admin",
  SYSTEM_ADMIN: "System Admin",
};

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user, role, isAdmin, isManager } = useCurrentUser();

  const { data: notifications } = useListNotifications({ unreadOnly: true });
  const unreadCount = notifications?.length || 0;

  const navItems = isAdmin ? ADMIN_NAV : isManager ? MANAGER_NAV : USER_NAV;
  const showNotifications = !isAdmin;

  const displayName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "Loading...";
  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Microscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">LabRes</span>
        </div>
        {isAdmin && (
          <div className="mt-3 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Admin Mode</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground group-hover:text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}

        {showNotifications && (
          <div className="pt-3 mt-3 border-t border-sidebar-border">
            <Link href="/notifications"
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location === "/notifications" ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              <Bell className="mr-3 h-4 w-4 flex-shrink-0 text-sidebar-foreground group-hover:text-sidebar-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto inline-block rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white">{unreadCount}</span>
              )}
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-sidebar-border">
            <Link href="/notifications"
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location === "/notifications" ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
              )}
            >
              <Bell className="mr-3 h-4 w-4 flex-shrink-0 text-sidebar-foreground group-hover:text-sidebar-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto inline-block rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-white">{unreadCount}</span>
              )}
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm shrink-0",
            isAdmin ? "bg-amber-500/20 text-amber-300" : "bg-sidebar-accent text-sidebar-primary"
          )}>
            {initials}
          </div>
          <div className="flex flex-col truncate min-w-0">
            <span className="truncate text-sm font-medium text-white">{displayName}</span>
            <span className="truncate text-xs text-sidebar-foreground/70">{ROLE_LABEL[role ?? ""] ?? role ?? "User"}</span>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-white"
        >
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

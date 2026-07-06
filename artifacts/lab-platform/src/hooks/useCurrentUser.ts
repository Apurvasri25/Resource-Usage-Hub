import { useGetCurrentUser } from "@workspace/api-client-react";

export type UserRole =
  | "RESEARCHER"
  | "LAB_TECHNICIAN"
  | "LAB_MANAGER"
  | "DEPT_HEAD"
  | "INSTITUTION_ADMIN"
  | "SYSTEM_ADMIN";

const ADMIN_ROLES: UserRole[] = ["INSTITUTION_ADMIN", "SYSTEM_ADMIN"];
const MANAGER_ROLES: UserRole[] = ["LAB_MANAGER", "DEPT_HEAD", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"];

export function useCurrentUser() {
  const { data: user, isLoading } = useGetCurrentUser();
  const role = user?.role as UserRole | undefined;
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const isManager = !!role && MANAGER_ROLES.includes(role);
  return { user, role, isAdmin, isManager, isLoading };
}

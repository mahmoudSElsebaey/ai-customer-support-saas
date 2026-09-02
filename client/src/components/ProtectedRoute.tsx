import { Navigate } from "react-router-dom";
import { useMeQuery } from "@/features/auth/authApi";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Array<"OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "CUSTOMER">;
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { data, isLoading, isError } = useMeQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(data.data.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">Access denied</p>
      </div>
    );
  }

  return <>{children}</>;
}

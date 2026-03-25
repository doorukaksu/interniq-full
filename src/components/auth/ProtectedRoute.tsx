import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires a signed-in Clerk session.
 * Unauthenticated users are redirected to /sign-in with the
 * intended path saved so they land back here after signing in.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // Clerk is still initialising — render nothing to avoid flash
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        state={{ returnTo: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
}
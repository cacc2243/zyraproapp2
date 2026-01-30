import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "lov_access_email";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const accessEmail = sessionStorage.getItem(STORAGE_KEY);
    
    if (accessEmail) {
      setIsAuthenticated(true);
    } else {
      // Redirect to home with flag to open auth drawer
      setIsAuthenticated(false);
      navigate("/?auth=open", { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return null;
  }

  // If not authenticated, will redirect (handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

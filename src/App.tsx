import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginUser } from "@/api";
import { LoginPage } from "@/components/LoginPage";
import { FreightDashboard } from "@/pages/FreightDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [user, setUser] = useState<LoginUser | null>(() => {
    const saved = localStorage.getItem("freight_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogin = useCallback((loggedInUser: LoginUser) => {
    setUser(loggedInUser);
    localStorage.setItem("freight_user", JSON.stringify(loggedInUser));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("freight_user");
    localStorage.removeItem("freight_active_tab");
    localStorage.removeItem("sidebar_collapsed");
    window.history.pushState({}, "", "/");
  }, []);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FreightDashboard user={user} onLogout={handleLogout} />
    </QueryClientProvider>
  );
}

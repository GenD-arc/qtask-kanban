import AppShell    from "./components/AppShell";
import LoginPage from "./components/auth/LoginPage";
import { useAuth } from "./context/useAuth";

export default function App() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return <LoginPage />;

  return <AppShell currentUser={currentUser} logout={logout} />;
}
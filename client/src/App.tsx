import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import TalentFormPage from "@/pages/TalentFormPage";
import TalentDetailPage from "@/pages/TalentDetailPage";
import ConversationsPage from "@/pages/ConversationsPage";
import ReservationsPage from "@/pages/ReservationsPage";

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold text-primary">
            동네 재능 큐레이션
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/talents/new" className="rounded bg-primary px-3 py-2 text-sm font-medium text-white">
              재능 등록
            </Link>
            <Link to="/conversations" className="text-sm font-medium text-slate-700 hover:text-primary">
              메시지
            </Link>
            <Link to="/reservations" className="text-sm font-medium text-slate-700 hover:text-primary">
              예약 현황
            </Link>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                로그아웃
              </button>
            ) : (
              <Link to="/auth" className="text-sm font-medium text-slate-700 hover:text-primary">
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/talents/new" element={<ProtectedRoute><TalentFormPage mode="create" /></ProtectedRoute>} />
          <Route path="/talents/:id" element={<TalentDetailPage />} />
          <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><ReservationsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

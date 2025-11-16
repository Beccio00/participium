import { Routes, Route, useLocation } from "react-router";
import { useAuth } from "./hooks/useAuth";
import LoadingSpinner from "./components/ui/LoadingSpinner.tsx";
import Header from "./components/Header";
import HomePage from "./features/reports/HomePage.tsx";
import LoginPage from "./features/auth/LoginPage.tsx";
import SignupPage from "./features/auth/SignupPage.tsx";
import AdminPanel from "./features/admin/AdminPanel.tsx";
import ReportForm from "./components/ReportForm";

function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header showBackToHome={location.pathname !== "/"} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/report/new" element={<ReportForm />} />
      </Routes>
    </div>
  );
}

export default App;

import { Routes, Route, useLocation } from "react-router";
import EmailVerification from "./components/EmailVerification";
import { useAuth } from "./hooks/useAuth";
import LoadingSpinner from "./components/ui/LoadingSpinner.tsx";
import Header from "./components/Header";
import HomePage from "./features/reports/HomePage.tsx";
import LoginPage from "./features/auth/LoginPage.tsx";
import SignupPage from "./features/auth/SignupPage.tsx";
import CitizenSettings from "./features/auth/CitizenSettings";
import AdminPanel from "./features/admin/AdminPanel.tsx";
import TechPanel from "./features/technician/TechPanel.tsx";
import ReportForm from "./components/ReportForm";
import { NotFound } from "./features/reports/NotFound";

function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header showBackToHome={location.pathname !== "/"} />
      <div
        style={{
          flex: 1,
          overflow: location.pathname === "/" ? "hidden" : "auto",
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/me" element={<CitizenSettings />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/assign-reports" element={<TechPanel />} />
          <Route path="/report/new" element={<ReportForm />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

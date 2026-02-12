import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Games from "./pages/Games";
import Credits from "./pages/Credits";
import ReviewLogs from "./pages/ReviewLogs";
import IndexGameLibrary from "./pages/IndexGameLibrary";
import Categories from "./pages/Categories";
import { ToastProvider } from "./contexts/ToastContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem("admin_token");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Global error listener to catch unhandled 401 errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Check if this is a 401 error
      if (error?.response?.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [navigate]);

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="games" element={<Games />} />
          <Route path="index-games" element={<IndexGameLibrary />} />
          <Route path="categories" element={<Categories />} />
          <Route path="credits" element={<Credits />} />
          <Route path="review-logs" element={<ReviewLogs />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;

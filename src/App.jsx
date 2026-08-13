import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDocuments from "./pages/AdminDocuments";
import AdminCbtBuilder from "./pages/AdminCbtBuilder";
import AdminCourses from "./pages/AdminCourses";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import UserLayout from "./pages/UserLayout";
import UserDashboard from "./pages/UserDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentDocuments from "./pages/StudentDocuments";
import StudentPractice from "./pages/StudentPractice";
import StudentNotifications from "./pages/StudentNotifications";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute>
                <VerifyEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin — protected, role = admin only */}
          <Route
            path="/console"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="cbt-builder" element={<AdminCbtBuilder />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Old /admin URLs → redirect to /console */}
          <Route path="/admin/*" element={<Navigate to="/console" replace />} />

          {/* Student */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="reading-hub" element={<StudentDocuments />} />
            <Route path="practice" element={<StudentPractice />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
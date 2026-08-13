import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
import AdminAgents from "./pages/AdminAgents";
import AdminChangeRequests from "./pages/AdminChangeRequests";
import AgentLayout from "./pages/AgentLayout";
import AgentDashboard from "./pages/AgentDashboard";
import UserLayout from "./pages/UserLayout";
import UserDashboard from "./pages/UserDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentDocuments from "./pages/StudentDocuments";
import StudentPractice from "./pages/StudentPractice";
import StudentNotifications from "./pages/StudentNotifications";
import StudentCourses from "./pages/StudentCourses";
import StudentSubscription from "./pages/StudentSubscription";
import StudentSettings from "./pages/StudentSettings";
import StudentTimetable from "./pages/StudentTimetable";
import StudentUpgrade from "./pages/StudentUpgrade";

export default function App() {
  return (
    <ThemeProvider>
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
              <Route path="change-requests" element={<AdminChangeRequests />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="cbt-builder" element={<AdminCbtBuilder />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="/admin/*" element={<Navigate to="/console" replace />} />

            <Route
              path="/agent"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AgentDashboard />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="cbt-builder" element={<AdminCbtBuilder />} />
            </Route>

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
              <Route path="courses" element={<StudentCourses />} />
              <Route path="reading-hub" element={<StudentDocuments />} />
              <Route path="practice" element={<StudentPractice />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="subscription" element={<StudentSubscription />} />
              <Route path="upgrade" element={<StudentUpgrade />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

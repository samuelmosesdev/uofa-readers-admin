import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDocuments from "./pages/AdminDocuments";
import AdminCbtBuilder from "./pages/AdminCbtBuilder";
import AdminCourses from "./pages/AdminCourses";
import AdminAgents from "./pages/AdminAgents";
import AdminPayments from "./pages/AdminPayments";
import AdminSettings from "./pages/AdminSettings";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminRequests from "./pages/AdminRequests";
import AdminActivityLog from "./pages/AdminActivityLog";
import AgentLayout from "./pages/AgentLayout";
import AgentDashboard from "./pages/AgentDashboard";
import UserLayout from "./pages/UserLayout";
import UserDashboard from "./pages/UserDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentDocuments from "./pages/StudentDocuments";
import StudentCourseReading from "./pages/StudentCourseReading";
import DocumentReader from "./pages/DocumentReader";
import StudentPractice from "./pages/StudentPractice";
import StudentUpgrade from "./pages/StudentUpgrade";
import StudentTimetable from "./pages/StudentTimetable";
import StudentNotifications from "./pages/StudentNotifications";
import ArchivedNotifications from "./pages/ArchivedNotifications";
import StudentCourses from "./pages/StudentCourses";
import StudentSettings from "./pages/StudentSettings";
// CourseRepPanel imported later
import StudentReference from "./pages/StudentReference";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="cbt-builder" element={<AdminCbtBuilder />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="activity-log" element={<AdminActivityLog />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
            </Route>

            <Route
              path="/agent"
              element={
                <ProtectedRoute requiredRole={["agent", "alphaAgent"]}>
                  <AgentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AgentDashboard />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="cbt-builder" element={<AdminCbtBuilder />} />
              <Route path="requests" element={<AdminRequests />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole={["user", "courseRep"]}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="reading-hub" element={<StudentDocuments />} />
              <Route path="reading-hub/doc/:docId" element={<DocumentReader />} />
              <Route path="reading-hub/:courseCode" element={<StudentCourseReading />} />
              <Route path="practice" element={<StudentPractice />} />
              <Route path="upgrade" element={<StudentUpgrade />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="notifications/archived" element={<ArchivedNotifications />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="course-rep" element={<CourseRepPanel />} />
              <Route path="reference" element={<StudentReference />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/Spinner";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientHome from "./pages/patient/PatientHome";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import MyBills from "./pages/patient/MyBills";
import PatientReviews from "./pages/patient/PatientReviews";
import PatientSymptomChecker from "./pages/patient/PatientSymptomChecker";
import Notices from "./pages/Notices";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorSlots from "./pages/doctor/DoctorSlots";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminNotices from "./pages/admin/AdminNotices";

/** Sends a logged-in user to their role's home, else to the public landing. */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "doctor") return <Navigate to="/doctor/appointments" replace />;
  return <Navigate to="/patient/home" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Patient */}
        <Route
          path="/patient/home"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/book"
          element={
            <ProtectedRoute roles={["patient"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute roles={["patient"]}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/bills"
          element={
            <ProtectedRoute roles={["patient"]}>
              <MyBills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/symptom-checker"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientSymptomChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/reviews"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/notices"
          element={
            <ProtectedRoute roles={["patient"]}>
              <Notices />
            </ProtectedRoute>
          }
        />

        {/* Doctor */}
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/slots"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorSlots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/notices"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <Notices />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminNotices />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/home" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

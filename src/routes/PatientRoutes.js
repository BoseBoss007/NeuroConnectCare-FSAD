import { Routes, Route } from "react-router-dom";
import PatientDashboard from "../pages/patient/PatientDashboard";
import PatientAppointments from "../pages/patient/PatientAppointments";
import PatientResults from "../pages/patient/PatientResults";
import PatientProfile from "../pages/patient/PatientProfile";
import Contact from "../pages/patient/Contact";
import BookAppointment from "../pages/patient/BookAppointment";

export default function PatientRoutes() {
  return (
    <Routes>
      <Route index element={<PatientDashboard />} />

      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="appointments" element={<PatientAppointments />} />
      <Route path="results" element={<PatientResults />} />
      <Route path="profile" element={<PatientProfile />} />
      <Route path="contact" element={<Contact />} />
      <Route path="book" element={<BookAppointment />} />

    </Routes>
  );
}

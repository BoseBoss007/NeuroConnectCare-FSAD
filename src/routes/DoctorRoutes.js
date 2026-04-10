import { Routes, Route, BrowserRouter } from "react-router-dom";

import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorUpload from "../pages/doctor/DoctorUpload";
import DoctorPatients from "../pages/doctor/DoctorPatients";
import DoctorAnalytics from "../pages/doctor/DoctorAnalytics";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorSinglePrediction from "../pages/doctor/DoctorSinglePrediction";

export default function DoctorRoutes() {
  return (

    <Routes>
      <Route path="dashboard" element={<DoctorDashboard />} />
      <Route path="upload" element={<DoctorUpload />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="analytics" element={<DoctorAnalytics />} />
      <Route path="predictions" element={<DoctorSinglePrediction />} />
      <Route path="profile" element={<DoctorProfile />} />
    </Routes>
  
  );
}
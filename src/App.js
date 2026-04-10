import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// public pages
import Home from "./pages/Home";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientRegister from "./pages/patient/PatientRegister";
import DoctorLogin from "./pages/doctor/DoctorLogin";

// patient routes
import PatientRoutes from "./routes/PatientRoutes";

// doctor routes
import DoctorRoutes from "./routes/DoctorRoutes";

// auth checks
const isPatientLoggedIn = () => {
  return !!localStorage.getItem("patientId");
};

const isDoctorLoggedIn = () => {
  return !!localStorage.getItem("doctorId");
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />

        {/* PATIENT ROUTES */}
        <Route
          path="/patient/*"
          element={
            isPatientLoggedIn()
              ? <PatientRoutes />
              : <Navigate to="/patient/login" />
          }
        />

        {/* DOCTOR ROUTES */}
        <Route
          path="/doctor/*"
          element={
            isDoctorLoggedIn()
              ? <DoctorRoutes />
              : <Navigate to="/doctor/login" />
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
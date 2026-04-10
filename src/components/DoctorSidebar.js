import { Link, useLocation } from "react-router-dom";

export default function DoctorSidebar() {
  const location = useLocation();

  const linkClass = (path) =>
    `px-4 py-2 rounded-md text-sm ${
      location.pathname === path
        ? "bg-slate-700 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 min-h-[calc(100vh-4rem)] p-5 flex flex-col gap-4">
      <Link to="/doctor/dashboard" className={linkClass("/doctor/dashboard")}>
        Patient Queue
      </Link>

      <Link to="/doctor/patients" className={linkClass("/doctor/patients")}>
        Patients
      </Link>

      <Link to="/doctor/upload" className={linkClass("/doctor/upload")}>
        Train Model
      </Link>

      <Link to="/doctor/analytics" className={linkClass("/doctor/analytics")}>
        Analytics
      </Link>

      <Link to="/doctor/predictions" className={linkClass("/doctor/predictions")}>
        Predictions
      </Link>

      <Link to="/doctor/profile" className={linkClass("/doctor/profile")}>
        Profile
      </Link>
    </div>
  );
}

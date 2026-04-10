import { NavLink } from "react-router-dom";
import sidebarStyles from "../styles/sidebar.styles";

export default function Sidebar() {
  const getClass = ({ isActive }) =>
    `${sidebarStyles.link} ${isActive ? sidebarStyles.active : ""}`;

  return (
    <div className={sidebarStyles.sidebar}>

      <NavLink
        to="/patient/dashboard"
        end
        className={getClass}
      >
        <i className="fas fa-calendar-plus"></i> Book Appointment
      </NavLink>

      <NavLink
        to="/patient/appointments"
        className={getClass}
      >
        <i className="fas fa-calendar-alt"></i> My Appointments
      </NavLink>

      <NavLink
        to="/patient/results"
        className={getClass}
      >
        <i className="fas fa-file-medical"></i> Test Results
      </NavLink>

      <NavLink
        to="/patient/profile"
        className={getClass}
      >
        <i className="fas fa-user"></i> My Profile
      </NavLink>

      <NavLink
        to="/patient/contact"
        className={getClass}
      >
        <i className="fas fa-envelope"></i> Contact Us
      </NavLink>

    </div>
  );
}
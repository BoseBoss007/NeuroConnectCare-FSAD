import { useNavigate } from "react-router-dom";
import homeStyles from "../styles/home.styles";
import brain from "../assests/brain.webp";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={homeStyles.container}>
      
   
      <div className={homeStyles.header}>
        <img
          src={brain}
          alt="Brain Logo"
          className={homeStyles.headerImage}
        />
        <h1 className={homeStyles.headerTitle}>
          NeuroCare Connect
        </h1>
      </div>

     
      <div className={homeStyles.main}>
        
     
        <div className={homeStyles.leftSection}>
          <h2 className={homeStyles.title}>
            For Doctors
          </h2>
          <p className={homeStyles.subtitle}>
            Advanced Analytics & Patient Management
          </p>
          <button
            className={homeStyles.doctorButton}
            onClick={() => navigate("/doctor/login")}
          >
            Doctor Portal
          </button>
        </div>

        <div className={homeStyles.rightSection}>
          <h2 className={homeStyles.title}>
            For Patients
          </h2>
          <p className={homeStyles.subtitle}>
            Book Appointments & View Records
          </p>
          <button
            className={homeStyles.patientButton}
            onClick={() => navigate("/patient/login")}
          >
            Patient Portal
          </button>
        </div>

      </div>
    </div>
  );
}

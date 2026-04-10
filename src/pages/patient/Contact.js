import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import patientContactStyles from "../../styles/patientContact.styles";

export default function Contact() {
  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] bg-[#f3faf7]">
        <Sidebar />

        <div className="flex-1 p-8">
          <h2 className={patientContactStyles.pageTitle}>
            Contact Us
          </h2>

          <div className={patientContactStyles.card}>
            <div className={patientContactStyles.section}>
              <i className={`fas fa-hospital ${patientContactStyles.icon}`}></i>
              <div>
                <p className={patientContactStyles.label}>
                  Organization
                </p>
                <p className={patientContactStyles.value}>
                  NeuroCare Connect
                </p>
              </div>
            </div>

            <div className={patientContactStyles.section}>
              <i className={`fas fa-envelope ${patientContactStyles.icon}`}></i>
              <div>
                <p className={patientContactStyles.label}>
                  Email
                </p>
                <p className={patientContactStyles.value}>
                  support@neurocare.com
                </p>
              </div>
            </div>

            <div className={patientContactStyles.section}>
              <i className={`fas fa-phone ${patientContactStyles.icon}`}></i>
              <div>
                <p className={patientContactStyles.label}>
                  Phone
                </p>
                <p className={patientContactStyles.value}>
                  +91 9876543210
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

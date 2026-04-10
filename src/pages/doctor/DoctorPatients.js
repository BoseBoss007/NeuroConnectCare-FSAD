import { useEffect, useState } from "react";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

export default function DoctorPatients() {
  const doctorId = localStorage.getItem("doctorId");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!doctorId) return;
    fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`)
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments || []));
  }, [doctorId]);

  const uniquePatients = appointments.reduce((acc, appt) => {
    if (!acc.find((p) => p.patientId === appt.patientId)) {
      acc.push({ patientId: appt.patientId, lastDate: appt.date });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="flex">
        <DoctorSidebar />
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-semibold mb-6">Patients</h2>

          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-slate-300 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Last Appointment</th>
                  <th className="px-6 py-4">Total Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {uniquePatients.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                      No Patients Found
                    </td>
                  </tr>
                )}
                {uniquePatients.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-800 transition">
                    <td className="px-6 py-4">{p.patientId}</td>
                    <td className="px-6 py-4">{p.lastDate}</td>
                    <td className="px-6 py-4">
                      {appointments.filter((a) => a.patientId === p.patientId).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

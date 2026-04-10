import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function PatientAppointments() {
  const patientId = localStorage.getItem("patientId");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/api/appointments/patient/${patientId}`)
      .then(res => res.json())
      .then(data => {
        const bookedAppointments = data.appointments.filter(
          app => app.status === "BOOKED"
        );
        setAppointments(bookedAppointments);
      });
  }, [patientId]);

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Cancel this appointment?")) return;

    await fetch(
      `http://localhost:5001/api/appointments/${appointmentId}`,
      { method: "DELETE" }
    );

    setAppointments(prev => prev.filter(app => app._id !== appointmentId));
  };

  const rescheduleAppointment = async (appointmentId) => {
    const newTime = prompt("Enter new time (Morning, Afternoon, Night)");
    if (!newTime) return;

    const res = await fetch(
      `http://localhost:5001/api/appointments/reschedule/${appointmentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTime }),
      }
    );

    if (!res.ok) {
      alert("Reschedule failed");
      return;
    }

    setAppointments(prev =>
      prev.map(app =>
        app._id === appointmentId ? { ...app, time: newTime } : app
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f3faf7] text-slate-800 font-sans">
      <Header />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar className="w-64" />

        <div className="flex-1 p-10 max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">
            My Appointments
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-700">Upcoming Appointments</h3>
            </div>

            <div className="divide-y divide-slate-200">
              {appointments.map(app => (
                <div key={app._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{app.doctorName || `Doctor ID: ${app.doctorId}`}</h4>
                    <p className="text-sm text-slate-500">
                      📅 {app.date}  |  🕒 {app.time}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0 flex gap-3 text-sm font-semibold">
                    <button
                      onClick={() => rescheduleAppointment(app._id)}
                      className="px-4 py-2 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => cancelAppointment(app._id)}
                      className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}

              {appointments.length === 0 && (
                <div className="px-8 py-12 flex flex-col items-center justify-center text-slate-500">
                  <span className="text-4xl mb-3">📭</span>
                  <p>You have no upcoming appointments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

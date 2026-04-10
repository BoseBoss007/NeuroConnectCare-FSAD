import { useEffect, useState } from "react";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

export default function DoctorDashboard() {
  const doctorId = localStorage.getItem("doctorId");
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!doctorId) return;

    fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`)
      .then(res => res.json())
      .then(data => {
        setQueue(data.appointments || []);
      });
  }, [doctorId]);

  const finishConsultation = async (appointmentId) => {
    await fetch(
      `http://localhost:5001/api/appointments/finish/${appointmentId}`,
      { method: "PUT" }
    );

    // Real-time UI update
    setQueue(prev =>
      prev.map(item =>
        item._id === appointmentId
          ? { ...item, status: "COMPLETED" }
          : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      {/* HEADER */}
      <Header />

      {/* BODY */}
      <div className="flex">
        
        {/* SIDEBAR */}
        <DoctorSidebar />

        {/* MAIN CONTENT */}
        <div className="flex-1 p-8">

          {/* Title */}
          <h2 className="text-2xl font-semibold mb-6">
            Patient Queue
          </h2>

          {/* Table Container */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">

            <table className="w-full text-sm text-left">
              
              {/* Table Head */}
              <thead className="bg-slate-800 text-slate-300 uppercase text-xs tracking-wider">
                <tr>
                  {/* <th className="px-6 py-4">Patient Name</th> */}
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800">

                {queue.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No Appointments Available
                    </td>
                  </tr>
                )}

                {queue.map(patient => (
                  <tr
                    key={patient._id}
                    className="hover:bg-slate-800 transition"
                  >
                    {/* <td className="px-6 py-4">
                      {patient.patientName || "N/A"}
                    </td> */}

                    <td className="px-6 py-4">
                      {patient.patientId}
                    </td>

                    <td className="px-6 py-4">
                      {patient.date}
                    </td>

                    <td className="px-6 py-4">
                      {patient.time}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          patient.status === "COMPLETED"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-4">
                      {patient.status === "BOOKED" && (
                        <button
                          onClick={() =>
                            finishConsultation(patient._id)
                          }
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md text-xs transition"
                        >
                          Finish
                        </button>
                      )}
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

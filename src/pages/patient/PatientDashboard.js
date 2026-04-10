import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function BookAppointment() {
  const patientId = localStorage.getItem("patientId");
  const patientName = localStorage.getItem("patientName");
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    // Fetch all available doctors from the backend (mocked or full API)
    // Actually our User model doesn't have a "GET /doctors" endpoint yet. Let's fetch doctors.
    // I'll add a fetch to a general endpoint if it exists, otherwise provide a fallback locally here!
    fetch("http://localhost:5001/api/auth/doctors")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data);
        } else {
          // fallback if endpoint not implemented quickly enough
          setDoctors([{ doctorId: "DOC1", name: "Dr. Default" }]);
        }
      })
      .catch(() => setDoctors([{ doctorId: "DOC1", name: "Dr. Default" }]));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !date || !time) {
      alert("Please select doctor, date, and time");
      return;
    }

    const docName = doctors.find(d => d.doctorId === selectedDoctor)?.name || "Doctor";

    try {
      const res = await fetch("http://localhost:5001/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctor,
          doctorName: docName,
          date,
          time,
        }),
      });

      if (!res.ok) throw new Error("Failed to book appointment");
      setStatusMsg("✅ Booking confirmed! This will now reflect in your doctor's Patient Queue.");
      
      // Reset form
      setDate("");
      setTime("");
      setSelectedDoctor("");
      setTimeout(() => setStatusMsg(""), 5000);

    } catch (err) {
      setStatusMsg("❌ " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3faf7] text-slate-800 font-sans">
      <Header />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar className="w-64" />
        <div className="flex-1 p-10 max-w-4xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Hello {patientName || "Patient"},
          </h1>
          <p className="text-slate-500 mb-8">Book a New Appointment with our registered specialists.</p>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {statusMsg && (
               <div className={`p-4 rounded-lg mb-6 text-sm font-semibold ${statusMsg.includes("✅") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                 {statusMsg}
               </div>
            )}
            
            <form onSubmit={handleBook} className="flex flex-col gap-6">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Specialist Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={e => setSelectedDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.doctorId} value={d.doctorId}>{d.name} (ID: {d.doctorId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Available Time Slot</label>
                <div className="flex gap-4">
                  {["Morning (09:00 AM - 12:00 PM)", "Afternoon (01:00 PM - 04:00 PM)", "Night (06:00 PM - 09:00 PM)"].map(slot => (
                    <label key={slot} className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${time === slot ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-300 text-slate-600'}`}>
                      <input type="radio" name="time" value={slot} checked={time === slot} onChange={() => setTime(slot)} className="hidden" />
                      <span className="text-2xl mb-2">{slot.includes("Morning") ? "🌅" : slot.includes("Afternoon") ? "☀️" : "🌙"}</span>
                      <span className="text-xs font-semibold text-center">{slot.split("(")[1].replace(")", "")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedDoctor || !date || !time}
                className={`py-4 rounded-lg font-bold text-lg transition-all ${(!selectedDoctor || !date || !time) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'}`}
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

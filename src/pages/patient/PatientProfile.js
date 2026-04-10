import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function PatientProfile() {
  const patientId = localStorage.getItem("patientId");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!patientId) return;

    fetch(`http://localhost:5001/api/auth/patient/profile/${patientId}`)
      .then(res => res.json())
      .then(data => {
        setName(data.name || "");
        setEmail(data.email || "");
        if (data.dateOfBirth) {
          setDateOfBirth(data.dateOfBirth.split("T")[0]);
        }
      })
      .catch(err => console.error("Profile fetch error:", err));
  }, [patientId]);

  const saveProfile = async () => {
    const res = await fetch(
      `http://localhost:5001/api/auth/patient/profile/${patientId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, dateOfBirth }),
      }
    );

    if (!res.ok) {
      setMsg("❌ Failed to update profile.");
      return;
    }

    // Update local storage in case name changed
    localStorage.setItem("patientName", name);
    setMsg("✅ Profile saved successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f3faf7] text-slate-800 font-sans">
      <Header />
      <div className="flex min-h-[calc(100vh-72px)]">
        <Sidebar className="w-64" />

        <div className="flex-1 p-10 max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">
            My Profile
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {msg && (
               <div className={`p-4 rounded-lg mb-6 text-sm font-semibold ${msg.includes("✅") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                 {msg}
               </div>
            )}
            
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold shadow-md transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

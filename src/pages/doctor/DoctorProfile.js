import { useEffect, useState } from "react";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

export default function DoctorProfile() {
  const doctorId = localStorage.getItem("doctorId");

  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) {
      setError("Doctor ID not found in session");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5001/api/auth/doctor/profile/${doctorId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Doctor data received:", data);
        setForm(data);
        setError("");
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile: " + err.message);
        setLoading(false);
      });
  }, [doctorId]);

  const saveProfile = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/auth/doctor/profile/${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, contactNumber: form.contactNumber }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Profile updated:", data);
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile: " + err.message);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <DoctorSidebar />

        <div className="flex-1 p-8">
          <h2 className="text-2xl font-semibold mb-6">Doctor Profile</h2>

          {error && (
            <div className="bg-red-600/20 text-red-400 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-slate-400">Loading profile...</div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Doctor Name</label>
                <input
                  type="text"
                  placeholder="Enter doctor name"
                  value={form.doctorName || ""}
                  onChange={(e) =>
                    setForm({ ...form, doctorName: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white px-4 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={form.email || ""}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white px-4 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Contact Number</label>
                <input
                  type="tel"
                  placeholder="Enter contact number"
                  value={form.contactNumber || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contactNumber: e.target.value,
                    })
                  }
                  className="w-full bg-slate-800 text-white px-4 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-slate-500"
                />
              </div>

              <button
                onClick={saveProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md mt-6 transition"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

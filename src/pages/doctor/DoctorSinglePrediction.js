import { useState, useEffect, useRef } from "react";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

// ── Disorder colour palette & mappings ────────────────────────────
const DISORDER_META = {
  ASD:     { label: "Autism Spectrum Disorder",    color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  SZ:      { label: "Schizophrenia",               color: "#f43f5e", bg: "rgba(244,63,94,0.15)"  },
  BD:      { label: "Bipolar Disorder",            color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  SAD:     { label: "Seasonal Affective Disorder", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  DA:      { label: "Drug Addiction",              color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  Healthy: { label: "No diagnosed disorder",       color: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
};

export default function DoctorSinglePrediction() {
  const doctorId = localStorage.getItem("doctorId");
  const fileInputRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all unique patients who have visited this doctor
  useEffect(() => {
    if (!doctorId) return;
    fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`)
      .then(res => res.json())
      .then(data => {
        const unique = [];
        (data.appointments || []).forEach(appt => {
          if (!unique.find(p => p.patientId === appt.patientId)) {
            unique.push({ id: appt.patientId, name: appt.patientName || appt.patientId });
          }
        });
        setPatients(unique);
      })
      .catch(err => console.error("Could not load patients:", err));
  }, [doctorId]);

  const handlePredict = async () => {
    if (!selectedPatient || !file) {
      setError("Please select a patient and upload a CSV file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", selectedPatient);

    try {
      const res = await fetch("http://localhost:5001/api/fl/predict-single", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to predict");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <Header />
      <div className="flex">
        <DoctorSidebar />
        
        <div className="flex-1 p-10 max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Single Patient Inference
          </h1>
          <p className="text-slate-400 mb-8">
            Upload a single patient CSV record. The pre-trained global Federated Learning model will evaluate the features locally and assign the prediction directly to their profile.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded mb-6">{error}</div>}
            
            <div className="flex gap-6 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-3 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose from Patient Queue --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                  ))}
                  {/* Fallback to allow manual ID entry test */}
                  <option value="test_patient_1">Test Patient 1 (Manual Entry)</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Patient CSV File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${file ? 'border-green-500 bg-green-500/5' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="hidden" />
                  {file ? <span className="text-green-400 font-medium">{file.name}</span> : <span className="text-slate-500">Click to browse file</span>}
                </div>
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || !file || !selectedPatient}
              className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all ${
                loading || !file || !selectedPatient 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 shadow-indigo-500/20 text-white"
              }`}
            >
              {loading ? "Analysing Features..." : "🧠 Predict Mental Disorder"}
            </button>

            {/* Prediction Result Box */}
            {result && (() => {
              const meta = DISORDER_META[result.predicted_disorder] || DISORDER_META.Healthy;
              const sev = result.severity_percentage;
              return (
                <div className="mt-10 p-6 rounded-2xl border" style={{ borderColor: `${meta.color}40`, backgroundColor: `${meta.color}05` }}>
                  <h3 className="text-sm uppercase tracking-wider font-bold mb-4 text-slate-400">Diagnosis Assessed</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black mb-1" style={{ color: meta.color }}>
                        {result.disorder_full}
                      </h2>
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border" style={{ color: meta.color, backgroundColor: meta.bg, borderColor: `${meta.color}30` }}>
                        Algorithm Ref: {result.predicted_disorder}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-400 mb-1">Severity / Confidence Match</p>
                      <div className="flex items-center justify-end gap-3">
                        <span className={`text-2xl font-black ${sev > 75 ? 'text-green-500' : sev > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {sev.toFixed(1)}%
                        </span>
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${sev}%`, backgroundColor: meta.color }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-6 text-sm text-slate-500">
                    ✅ Result successfully mapped and saved to Patient ID #{selectedPatient}. They will now see this in their Test Results tab.
                  </p>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

// ── sessionStorage helpers ─────────────────────────────────────
const SS = {
  get:    (k, fallback = null) => { try { const v = sessionStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (k, v)               => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Disorder colour palette & mappings ────────────────────────────
const DISORDER_META = {
  ASD:     { label: "Autism Spectrum Disorder",    color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  SZ:      { label: "Schizophrenia",               color: "#f43f5e", bg: "rgba(244,63,94,0.15)"  },
  BD:      { label: "Bipolar Disorder",            color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  SAD:     { label: "Seasonal Affective Disorder", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  DA:      { label: "Drug Addiction",              color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  Healthy: { label: "No diagnosed disorder",       color: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
};

// ── Utility: Donut Chart ───────────────────────────────────────
function DonutChart({ dataCounts }) {
  if (!dataCounts || Object.keys(dataCounts).length === 0) return null;
  const W = 200, H = 200, cx = W / 2, cy = H / 2, r = 70, strokeW = 25;
  const total = Object.values(dataCounts).reduce((a, b) => a + b, 0);
  
  let startAngle = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ maxHeight: "250px" }}>
      {Object.entries(dataCounts).map(([key, count]) => {
        if (count === 0) return null;
        const color = DISORDER_META[key]?.color || "#94a3b8";
        const pct = count / total;
        const endAngle = startAngle + pct * 360;
        
        // Convert polar angle to cartesian coordinates
        const x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
        const y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
        const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
        const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);
        const largeArc = pct > 0.5 ? 1 : 0;
        
        const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
        startAngle = endAngle;

        return (
          <path
            key={key}
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="butt"
            style={{ transition: "all 0.4s ease" }}
          />
        );
      })}
      <text x={cx} y={cy - 5} fill="#e2e8f0" fontSize="24" fontWeight="bold" textAnchor="middle">{total}</text>
      <text x={cx} y={cy + 15} fill="#64748b" fontSize="12" textAnchor="middle">Patients</text>
    </svg>
  );
}

// ── Utility: Line Chart ────────────────────────────────────────
function AccuracyChart({ history }) {
  if (!history || history.length < 2) return null;
  const W = 520, H = 160, PAD = 28;
  const maxAcc = Math.max(...history, 10);
  const pts = history.map((v, i) => {
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v / maxAcc) * (H - PAD * 2));
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M ${pts[0]} ${pts.slice(1).map(p => "L " + p).join(" ")} L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"  />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = H - PAD - (pct / maxAcc) * (H - PAD * 2);
        return (
          <g key={pct}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
            <text x={PAD - 4} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{pct}%</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#chartGrad)" />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.length > 0 && (() => {
        const [lx, ly] = pts[pts.length - 1].split(",").map(Number);
        return (
          <>
            <circle cx={lx} cy={ly} r={5} fill="#6366f1" />
            <text x={lx + 7} y={ly + 4} fill="#a5b4fc" fontSize="10" fontWeight="bold">
              {history[history.length - 1].toFixed(1)}%
            </text>
          </>
        );
      })()}
      {[1, 10, 20, 30, 40, 50].map(ep => {
        const idx = Math.min(ep - 1, history.length - 1);
        const x = PAD + (idx / (history.length - 1 || 1)) * (W - PAD * 2);
        return <text key={ep} x={x} y={H - 6} fill="#64748b" fontSize="9" textAnchor="middle">{ep}</text>;
      })}
    </svg>
  );
}

// ── Main Page Component ────────────────────────────────────────
export default function DoctorAnalytics() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  // Use URL param first, fall back to last completed jobId in sessionStorage
  const jobId = queryParams.get("jobId") || SS.get("fl_jobId", null);

  const [results, setResults] = useState(() => SS.get("fl_analyticsResults", null));
  const [error, setError] = useState(null);
  const [filterDisorder, setFilterDisorder] = useState("All");
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    if (!jobId) return;
    // If we already have cached results for this exact jobId, skip the fetch
    const cached = SS.get("fl_analyticsResults", null);
    if (cached && SS.get("fl_analyticsJobId", null) === jobId) {
      setResults(cached);
      return;
    }
    // Fetch fresh results
    fetch(`http://localhost:5001/api/fl/results/${jobId}`)
      .then(res => {
        if (!res.ok) throw new Error("Could not find predictions for this Job ID");
        return res.json();
      })
      .then(data => {
        setResults(data);
        SS.set("fl_analyticsResults", data);    // ← cache results
        SS.set("fl_analyticsJobId",   jobId);   // ← track which job they belong to
      })
      .catch(err => setError(err.message));
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Header />
        <div className="flex">
          <DoctorSidebar />
          <div className="flex-1 p-16 flex flex-col items-center justify-center text-slate-500">
            <span className="text-6xl mb-4">🔮</span>
            <h2 className="text-xl font-bold text-slate-300">No Job ID Provided</h2>
            <p className="mt-2">Upload a dataset and train the model to view predictions.</p>
            <Link to="/doctor/upload" className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
              Go to Upload ➔
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const predictions = results?.predictions || [];
  const filtered = predictions.filter(p => {
    const matchDisorder = filterDisorder === "All" || p.predicted_disorder === filterDisorder;
    const matchId = searchId === "" || String(p.patient_id).includes(searchId);
    return matchDisorder && matchId;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <Header />
      <div className="flex">
        <DoctorSidebar />
        
        <div className="flex-1 p-8 overflow-y-auto max-w-[1400px]">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Model Predictions Dashboard
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Job ID: <span className="font-mono text-slate-500 text-xs">{jobId}</span>
              </p>
            </div>
            <Link to="/doctor/upload" className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              ➕ New Training Session
            </Link>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

          {!results && !error && (
            <div className="flex justify-center py-20 text-indigo-400 font-semibold animate-pulse">Loading predictions...</div>
          )}

          {results && (
            <>
              {/* Top Row: Visualizations */}
              <div className="flex gap-6 mb-8">
                
                {/* Accuracy Card */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex-1 shadow-lg">
                  <h3 className="font-semibold text-slate-300 mb-6 flex justify-between">
                    <span>Performance over Epochs</span>
                    <span className="text-green-400 text-sm bg-green-400/10 px-2 py-1 rounded">Final Acc: {results.final_accuracy?.toFixed(1)}%</span>
                  </h3>
                  <AccuracyChart history={results.accuracy_history} />
                </div>

                {/* Donut Card */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 w-1/3 min-w-[300px] shadow-lg flex flex-col items-center">
                  <h3 className="font-semibold text-slate-300 mb-2 w-full">Distribution</h3>
                  <div className="w-full flex-1 flex items-center justify-center">
                    <DonutChart dataCounts={results.disorder_counts} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {Object.entries(DISORDER_META).map(([code, meta]) => {
                      if (!results.disorder_counts[code]) return null;
                      return (
                        <div key={code} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                          {code}: {results.disorder_counts[code]}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Predictions Table Section */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="font-semibold text-slate-200">Patient Predictions</h3>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search ID..."
                      value={searchId}
                      onChange={e => setSearchId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-32"
                    />
                    <select
                      value={filterDisorder}
                      onChange={e => setFilterDisorder(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">All Disorders</option>
                      {Object.keys(DISORDER_META).map(k => (
                        <option key={k} value={k}>{k} - {DISORDER_META[k].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-[#0c111c] border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Patient ID</th>
                        <th className="px-6 py-4">Diagnosis Mapping</th>
                        <th className="px-6 py-4">Predicted Disorder</th>
                        <th className="px-6 py-4">Severity %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filtered.map((p, idx) => {
                        const meta = DISORDER_META[p.predicted_disorder] || DISORDER_META.Healthy;
                        return (
                          <tr key={p.patient_id ?? idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-300">#{p.patient_id}</td>
                            
                            {/* Explicit Name Mappings requested by User */}
                            <td className="px-6 py-4 text-slate-400">
                                {meta.label}
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ color: meta.color, backgroundColor: meta.bg, borderColor: `${meta.color}30` }}>
                                {p.predicted_disorder}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className={p.confidence > 75 ? "text-green-400 font-semibold" : p.confidence > 50 ? "text-amber-400 font-semibold" : "text-red-400 font-semibold"}>
                                  {p.confidence?.toFixed(1)}%
                                </span>
                                <div className="w-20 rounded-full h-1.5 bg-slate-800">
                                  <div className="h-full rounded-full" style={{ width: `${p.confidence}%`, backgroundColor: meta.color }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                            No records found. Note: Only 100 rows previewed.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

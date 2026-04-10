import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import patientLoginStyles from "../../styles/patientLogin.style";

export default function PatientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    const res = await fetch("http://localhost:5001/api/auth/login-patient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Invalid login");
      return;
    }

    localStorage.setItem("patientId", data.patientId);
    localStorage.setItem("patientName", data.name);
    localStorage.setItem("role", data.role);

    window.location.href = "/patient/dashboard";
  };

  return (
    <div className={patientLoginStyles.page}>
      <div className={patientLoginStyles.card}>
        <h2 className={patientLoginStyles.title}>
          Patient Sign In
        </h2>

        <form
          onSubmit={handleLogin}
          className={patientLoginStyles.form}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={patientLoginStyles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={patientLoginStyles.input}
          />

          <button
            type="submit"
            className={patientLoginStyles.primaryButton}
          >
            Login
          </button>
        </form>

        <div className="flex justify-between text-xs text-slate-400 mt-4 px-2">
          <span className="cursor-pointer hover:text-indigo-400" onClick={() => alert("Password reset link sent to your registered email.")}>
            Forgot Password?
          </span>
          <span>
            Don't have an account?{" "}
            <Link to="/patient/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

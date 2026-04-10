import { useState } from "react";
import { passwordRegex, emailRegex, phoneRegex } from "../../utils/validators";
import doctorLoginStyles from "../../styles/doctorLogon.style";

export default function DoctorLogin() {
  const [isLogin, setIsLogin] = useState(true);

  // Login states
  const [doctorId, setDoctorId] = useState("");
  
  // Register states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  
  // Shared state
  const [password, setPassword] = useState("");

  const validateRealtime = () => {
    let errs = {};
    if (email && !emailRegex.test(email)) errs.email = "Must end in @gmail.com";
    if (contactNumber && !phoneRegex.test(contactNumber)) errs.phone = "Must be 10 digits starting with 6-9";
    if (password && !passwordRegex.test(password)) errs.password = "Min 5 chars";
    return errs;
  };
  const errors = validateRealtime();

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!doctorId || !passwordRegex.test(password)) {
      alert("Invalid input - Please ensure all fields are correct");
      return;
    }

    const res = await fetch("http://localhost:5001/api/auth/login-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Invalid login");
      return;
    }
    localStorage.setItem("doctorId", data.doctorId);
    localStorage.setItem("doctorName", data.doctorName || "");
    localStorage.setItem("role", "doctor");
    window.location.href = "/doctor/dashboard";
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !contactNumber || !dateOfBirth || Object.keys(errors).length > 0) {
      alert("Please fix all validation errors before submitting.");
      return;
    }
    const res = await fetch("http://localhost:5001/api/auth/register-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, contactNumber, dateOfBirth, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }
    alert(`Registration successful! Your ID is: ${data.doctorId}. Please login.`);
    setIsLogin(true);
  };

  return (
    <div className={doctorLoginStyles.page}>
      <div className={doctorLoginStyles.card} style={{ height: isLogin ? '400px' : '550px', transition: 'height 0.3s' }}>
        <h2 className={doctorLoginStyles.title}>
          {isLogin ? "Doctor Secure Login" : "Doctor Registration"}
        </h2>

        {isLogin ? (
          <form onSubmit={submitLogin}>
            <input
              type="text"
              placeholder="Medical License ID (e.g. DOC1)"
              onChange={(e) => setDoctorId(e.target.value)}
              className={doctorLoginStyles.input}
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className={doctorLoginStyles.input}
            />
            {errors.password && <p className="text-red-500 text-xs text-left mt-1 mb-2">{errors.password}</p>}
            
            <button type="submit" className={doctorLoginStyles.button}>Login</button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="flex flex-col gap-2">
            <input type="text" placeholder="Full Name" onChange={e => setName(e.target.value)} className={doctorLoginStyles.input} style={{marginBottom: 0}} />
            
            <div>
              <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className={doctorLoginStyles.input} style={{marginBottom: 0, width: "100%"}} />
              {errors.email && <p className="text-red-500 text-[10px] text-left mt-1">{errors.email}</p>}
            </div>

            <div>
              <input type="text" placeholder="Contact Number" onChange={e => setContactNumber(e.target.value)} className={doctorLoginStyles.input} style={{marginBottom: 0, width: "100%"}} />
              {errors.phone && <p className="text-red-500 text-[10px] text-left mt-1">{errors.phone}</p>}
            </div>
            
            <input type="date" placeholder="Date of Birth" onChange={e => setDateOfBirth(e.target.value)} className={doctorLoginStyles.input} style={{ color: "#9ca3af", marginBottom: 0 }} />
            
            <div>
              <input type="password" placeholder="Password (Min 5 chars)" onChange={e => setPassword(e.target.value)} className={doctorLoginStyles.input} style={{marginBottom: 0, width: "100%"}} />
              {errors.password && <p className="text-red-500 text-[10px] text-left mt-1">{errors.password}</p>}
            </div>
            
            <button type="submit" className={doctorLoginStyles.button} style={{ background: "#4ade80", marginTop: "10px" }}>Register & Get ID</button>
          </form>
        )}

        <div className="flex justify-between text-xs text-slate-400 mt-4 px-2">
          {isLogin && (
            <span className="cursor-pointer hover:text-indigo-400" onClick={() => alert("Password reset link sent to your registered email.")}>
              Forgot Password?
            </span>
          )}
          <span className={!isLogin ? "w-full text-center" : ""}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
            >
              {isLogin ? "Register Here" : "Login Here"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

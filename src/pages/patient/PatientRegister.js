import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  emailRegex,
  phoneRegex,
  passwordRegex,
  dateRegex,
} from "../../utils/validators";
import patientRegisterStyles from "../../styles/patientRegister.style";

export default function PatientRegister() {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateRealtime = () => {
    let err = {};
    if (form.email && !emailRegex.test(form.email)) err.email = "Must end in @gmail.com";
    if (form.contactNumber && !phoneRegex.test(form.contactNumber)) err.contactNumber = "Must be 10 digits starting with 6-9";
    if (form.dateOfBirth && !dateRegex.test(form.dateOfBirth)) err.dateOfBirth = "Invalid date format";
    if (form.password && !passwordRegex.test(form.password)) err.password = "Min 5 chars";
    return err;
  };
  const realtimeErrors = validateRealtime();

  const validateSubmit = () => { 
    let err = {};
    if (!form.name) err.name = "Required";
    if (!form.email || realtimeErrors.email) err.email = "Invalid";
    if (!form.contactNumber || realtimeErrors.contactNumber) err.contactNumber = "Invalid";
    if (!form.dateOfBirth || realtimeErrors.dateOfBirth) err.dateOfBirth = "Invalid";
    if (!form.password || realtimeErrors.password) err.password = "Invalid";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const today = new Date().toISOString().split("T")[0];

  const submit = async () => {
    if (!validateSubmit()) return;

    const res = await fetch(
      "http://localhost:5001/api/auth/register-patient",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );

    if (res.ok) navigate("/patient/success");
    else alert("Registration failed");
  };

  const inputClass = (field) =>
    `${patientRegisterStyles.inputBase} ${
      errors[field]
        ? patientRegisterStyles.inputError
        : patientRegisterStyles.inputNormal
    }`;

  return (
    <div className={patientRegisterStyles.page}>
      <div className={patientRegisterStyles.card}>
        <h2 className={patientRegisterStyles.title}>
          Patient Register
        </h2>

        <input
          type="text"
          placeholder="Name"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className={inputClass("name")}
          style={{marginBottom: 0}}
        />

        <div>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className={inputClass("email")}
            style={{marginBottom: 0, width: "100%", marginTop: "10px"}}
          />
          {realtimeErrors.email && <p className="text-red-500 text-[10px] text-left mt-1">{realtimeErrors.email}</p>}
        </div>

        <div>
          <input
            type="tel"
            placeholder="Contact Number"
            onChange={(e) =>
              setForm({
                ...form,
                contactNumber: e.target.value,
              })
            }
            className={inputClass("contactNumber")}
            style={{marginBottom: 0, width: "100%", marginTop: "10px"}}
          />
          {realtimeErrors.contactNumber && <p className="text-red-500 text-[10px] text-left mt-1">{realtimeErrors.contactNumber}</p>}
        </div>

        <div>
          <input
            type="date"
            max={today}
            onChange={(e) =>
              setForm({
                ...form,
                dateOfBirth: e.target.value,
              })
            }
            className={inputClass("dateOfBirth")}
            style={{marginBottom: 0, width: "100%", marginTop: "10px"}}
          />
          {realtimeErrors.dateOfBirth && <p className="text-red-500 text-[10px] text-left mt-1">{realtimeErrors.dateOfBirth}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            className={inputClass("password")}
            style={{marginBottom: 0, width: "100%", marginTop: "10px"}}
          />
          {realtimeErrors.password && <p className="text-red-500 text-[10px] text-left mt-1 mb-2">{realtimeErrors.password}</p>}
        </div>

        <button
          onClick={submit}
          className={patientRegisterStyles.button}
        >
          Register
        </button>

        <p className={patientRegisterStyles.footerText}>
          Already registered?{" "}
          <Link
            to="/patient/login"
            className={patientRegisterStyles.footerLink}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import headerStyles from "../styles/header.styles";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className={headerStyles.header}>
      <h2 className={headerStyles.title}>
        <i className="fas fa-brain"></i>
        NeuroCare Connect
      </h2>

      <button onClick={logout} className={headerStyles.button}>
        Logout
      </button>
    </div>
  );
}

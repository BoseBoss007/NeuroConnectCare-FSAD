export const getPatient = () => {
  const patientId = localStorage.getItem("patientId");
  const name = localStorage.getItem("patientName");
  return { patientId, name };
};


export const logout = () => {
  localStorage.clear();
  window.location.href = "/";
};

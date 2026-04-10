const homeStyles = {
  container:
    "flex flex-col h-screen font-poppins",

  header:
    "flex items-center gap-4 px-10 py-4 shadow-md bg-white",

  headerImage:
    "w-12 h-12",

  headerTitle:
    "text-2xl font-semibold text-teal-600",

  main:
    "flex flex-1",

  leftSection:
    "flex-1 bg-gradient-to-b from-slate-900 to-blue-900 text-white flex flex-col justify-center items-center text-center px-10",

  rightSection:
    "flex-1 bg-teal-500 text-white flex flex-col justify-center items-center text-center px-10",

  title:
    "text-3xl font-bold mb-4",

  subtitle:
    "text-lg mb-6 max-w-md",

  doctorButton:
    "bg-teal-400 text-slate-900 px-6 py-3 rounded-lg font-medium transition transform hover:scale-110 hover:bg-teal-300",

  patientButton:
    "bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition transform hover:scale-110 hover:bg-slate-800",
};

export default homeStyles;

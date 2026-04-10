const bookAppointmentStyles = {
  pageTitle:
    "text-2xl font-semibold text-slate-800 mb-6",

  container:
    "bg-white rounded-xl shadow-md border border-slate-200 p-6",

  grid:
    "grid grid-cols-1 lg:grid-cols-2 gap-6",

  /* Doctor select */
  doctorSelect:
    "w-full mb-4 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400",

  /* Calendar section */
  calendarBox:
    "border rounded-lg p-4",

  calendarTitle:
    "text-slate-700 font-medium mb-3",

  dateInput:
    "w-full px-4 py-3 border rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400",

  /* Time slots */
  slotsBox:
    "border rounded-lg p-4 flex flex-col gap-4",

  slotGrid:
    "grid grid-cols-2 sm:grid-cols-3 gap-3",

  slotBtn:
    "border border-teal-400 text-teal-600 rounded-lg py-2 text-sm hover:bg-teal-50 transition",

  slotSelected:
    "bg-teal-500 text-white border-teal-500",

  confirmBtn:
    "mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition",
};

export default bookAppointmentStyles;

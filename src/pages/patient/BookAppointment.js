import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { getPatient } from "../../utils/auth";
import bookAppointmentStyles from "../../styles/bookAppointment.styles";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { patientId } = getPatient();

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/api/doctors")
      .then(res => res.json())
      .then(data => {
        setDoctors(data.doctors || data || []);
      });
  }, []);

  useEffect(() => {
    if (!doctorId || !date) return;

    fetch(`http://localhost:5001/api/availability/${doctorId}/${date}`)
      .then(res => res.json())
      .then(data => {
        const freeSlots = data.slots.filter(s => !s.isBooked);
        setSlots(freeSlots);
      });
  }, [doctorId, date]);

  const confirmBooking = async () => {
    if (!doctorId || !date || !selectedTime) {
      alert("Please select doctor, date and time");
      return;
    }

    const res = await fetch("http://localhost:5001/api/appointments/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        doctorId,
        doctorName: doctors.find(doc => doc.doctorId === doctorId)?.doctorName || "",
        date,
        time: selectedTime,
      }),
    });

    if (!res.ok) {
      alert("Booking failed");
      return;
    }

    alert("Appointment booked successfully");
    navigate("/patient/appointments");
  };

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

const minDate = `${yyyy}-${mm}-${dd}`;



  return (
    <>
      <Header />

      <div className="flex min-h-[calc(100vh-72px)] bg-[#f3faf7]">
        <Sidebar />

        <div className="flex-1 p-8">
          <h2 className={bookAppointmentStyles.pageTitle}>
            Book an Appointment
          </h2>

          <div className={bookAppointmentStyles.container}>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className={bookAppointmentStyles.doctorSelect}
            >
              <option value="">Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  {doc.doctorName}
                </option>
              ))}
            </select>

            <div className={bookAppointmentStyles.grid}>
              <div className={bookAppointmentStyles.calendarBox}>
                <p className={bookAppointmentStyles.calendarTitle}>
                  Select Date
                </p>

                <input
                  type="date"
                  value={date}
                  min={minDate}
                  onChange={e => setDate(e.target.value)}
                  className={bookAppointmentStyles.dateInput}
                />
              </div>

              <div className={bookAppointmentStyles.slotsBox}>
                <p className={bookAppointmentStyles.calendarTitle}>
                  Available Times
                </p>

                <div className={bookAppointmentStyles.slotGrid}>
                  {slots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`${bookAppointmentStyles.slotBtn} ${
                        selectedTime === slot.time
                          ? bookAppointmentStyles.slotSelected
                          : ""
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <button
                  onClick={confirmBooking}
                  className={bookAppointmentStyles.confirmBtn}
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

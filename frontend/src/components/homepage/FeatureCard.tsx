export default function Features() {
  const items = [
    { title: "Access Health Records", desc: "View your medical history, test results, and more" },
    { title: "Schedule Appointments", desc: "Book and manage your appointments online." },
    { title: "Change Clinics", desc: "Pick your desired doctor’s office" },
    { title: "Manage Prescriptions", desc: "View dose, timings, and refill information." },
  ];

  return (
    <section className="features">
      <div className="feature-card">
        <div className="grid">
          {items.map((x) => (
            <div key={x.title} className="feature">
              <h4>{x.title}</h4>
              <p className="muted">{x.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hospital-wrap">
        <img src="/assets/hospital.png" alt="Hospital illustration" className="hospital" />
      </div>
    </section>
  );
}
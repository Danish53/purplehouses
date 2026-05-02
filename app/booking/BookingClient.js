"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import flatpickr from "flatpickr";

const MORNING_SLOTS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
];
const AFTERNOON_SLOTS = [
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];
const EVENING_SLOTS = [
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
];

export default function BookingClient({ properties }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [form, setForm] = useState({
    property: "",
    date: "",
    time: "",
    fname: "",
    lname: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const dateRef = useRef(null);
  const stepMeta = [
    {
      id: 1,
      label: "Select Property",
      title: "Choose your preferred property",
      note: "Start by selecting the listing you want to tour.",
    },
    {
      id: 2,
      label: "Date & Time",
      title: "Pick your tour slot",
      note: "Select an available day and a suitable time.",
    },
    {
      id: 3,
      label: "Your Information",
      title: "Confirm your details",
      note: "Share your contact information to complete the booking.",
    },
  ];
  const progressWidth = `${((step - 1) / (stepMeta.length - 1)) * 100}%`;

  // useEffect(() => {
  //   if (step === 2 && dateRef.current && window.flatpickr) {
  //     window.flatpickr(dateRef.current, {
  //       // aaj ki date disable, kal se allow
  //       minDate: new Date().fp_incr(1),
  //       dateFormat: "Y-m-d",
  //       onChange(selectedDates, dateStr) {
  //         setForm((prev) => ({ ...prev, date: dateStr }));
  //       },
  //     });
  //   }
  // }, [step]);
  useEffect(() => {
    if (step !== 2 || !dateRef.current) return;

    const fp = flatpickr(dateRef.current, {
      minDate: new Date().setDate(new Date().getDate() + 1), // ✅ FIXED
      dateFormat: "Y-m-d",
      onChange(selectedDates, dateStr) {
        setForm((prev) => ({ ...prev, date: dateStr }));
      },
    });

    // ✅ cleanup (VERY IMPORTANT)
    return () => {
      if (fp) fp.destroy();
    };
  }, [step]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function selectTime(t) {
    setForm((prev) => ({ ...prev, time: t }));
  }

  function nextStep() {
    if (step === 1 && !form.property) {
      setStepError("Please select a property.");
      return;
    }
    if (step === 2 && (!form.date || !form.time)) {
      setStepError("Please select a date and time slot.");
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fname || !form.email || !form.phone) {
      setStepError("Please fill in all required fields.");
      return;
    }
    setStepError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        phone: "+1" + form.phone.replace(/\D/g, "").slice(0, 10),
      };
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/thankyou");
      } else {
        setStepError(data.error || "Failed to submit booking.");
      }
    } catch {
      setStepError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderSlots(slots, label) {
    return (
      <div className="slot-group">
        <h6>{label}</h6>
        <div
          className="slots"
        >
          {slots.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm booking-slot-btn${form.time === s ? " booking-slot-btn--active" : ""}`}
              onClick={() => selectTime(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="ph-page-shell">
      <div className="ph-page-hero">
        <div className="ph-page-hero__inner">
          <p className="ph-page-hero__title">Schedule a Showing</p>
          <div className="ph-page-hero__crumbs">
            <span>Home</span>
            <i className="fas fa-angle-right"></i>
            <span>Schedule a Showing</span>
          </div>
        </div>
      </div>

      <div className="ph-page-hero__content">
        <div className="container booking-shell-wrap">
          <div className="booking-shell booking-shell--modern">
            <div className="booking-onboard">
              <div className="booking-onboard__head">
                <p className="booking-onboard__step-count">
                  Step {step} of {stepMeta.length}
                </p>
                <h3>{stepMeta[step - 1].title}</h3>
                <p>{stepMeta[step - 1].note}</p>
              </div>

              <div className="booking-onboard__loader">
                <span style={{ width: progressWidth }} />
              </div>

              <ol className="booking-onboard__steps">
                {stepMeta.map((item) => (
                  <li
                    key={item.id}
                    className={`booking-onboard__step${step >= item.id ? " booking-onboard__step--active" : ""}${step === item.id ? " booking-onboard__step--current" : ""}`}
                  >
                    <span className="booking-onboard__dot">
                      {step > item.id ? (
                        <i className="fas fa-check" />
                      ) : (
                        `0${item.id}`
                      )}
                    </span>
                    <span className="booking-onboard__label">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Main Form */}
            <div className="booking-form-col">
              <form
                id="bookingForm"
                className="booking-form-card"
                onSubmit={handleSubmit}
              >
                {stepError && (
                  <div className="alert alert-danger py-2 mb-3">{stepError}</div>
                )}
                {/* Step 1 */}
                {step === 1 && (
                  <div className="step-content booking-step-content">
                    <div className="mb-3">
                      <label htmlFor="property" className="form-label">
                        Property
                      </label>
                      <select
                        className="form-select"
                        name="property"
                        value={form.property}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Property</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.prop_title}>
                            {p.prop_title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="step-content booking-step-content">
                    <div className="mb-3">
                      <label className="form-label">Select Date</label>
                      <input
                        ref={dateRef}
                        type="text"
                        className="form-control"
                        placeholder="Please Select Date"
                        name="date"
                        required
                        readOnly
                        value={form.date}
                        onClick={() => dateRef.current?.focus()}
                      />
                    </div>
                    {form.date && (
                      <div className="mb-3">
                        <label className="form-label">Select Time</label>
                        {renderSlots(MORNING_SLOTS, "Morning")}
                        {renderSlots(AFTERNOON_SLOTS, "Afternoon")}
                        {renderSlots(EVENING_SLOTS, "Evening")}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="step-content booking-step-content">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="fname"
                        placeholder="Enter Your First Name"
                        value={form.fname}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lname"
                        placeholder="Enter Your Last Name"
                        value={form.lname}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="Enter Your Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3 d-flex flex-column">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Enter 10 digit number"
                        name="phone"
                        value={form.phone}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          value = value.slice(0, 10);

                          setForm({ ...form, phone: value });
                        }}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="step-footer booking-step-footer d-flex justify-content-between mt-3">
                  {step > 1 && (
                    <button
                      type="button"
                      className="btn booking-nav-btn booking-nav-btn--secondary"
                      onClick={prevStep}
                    >
                      <i className="fas fa-arrow-left me-2" />
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      className="btn booking-nav-btn booking-nav-btn--primary"
                      onClick={nextStep}
                    >
                      Continue
                      <i className="fas fa-arrow-right ms-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn booking-nav-btn booking-nav-btn--primary"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Confirm Booking"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

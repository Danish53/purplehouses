"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { STATE_CHOICES } from "@/lib/constants";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const YEARS = Array.from(
  { length: 80 },
  (_, i) => new Date().getFullYear() - i,
);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HEAR_OPTIONS = [
  "Agent/Broker",
  "Drive-By/Walk-In",
  "Friend/Family",
  "Our Company Website",
  "Craigslist",
  "Facebook",
  "Instagram",
  "Snapchat",
  "Twitter",
  "Other",
  "Apartment Guide",
  "Apartment List",
  "Apartment.com",
  "For Rent",
  "FRBO",
  "Homes.com",
  "Hot Pads",
  "Lovely",
  "Move.com",
  "PadMappers",
  "Radpad",
  "Rentalads.com",
  "Rental.com",
  "ShowMeTheRent",
  "Trulia",
  "Walk Score",
  "Zillow",
  "Zumper",
];
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egypt" },
  { code: "TR", name: "Turkey" },
  { code: "IL", name: "Israel" },
  { code: "PL", name: "Poland" },
];

export default function ApplyingClient({
  properties,
  stripePublicKey,
  paypalClientId,
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    property_id: "",
    move_in_date: "",
    applicant_type: "tenant",
    first_name: "",
    last_name: "",
    email: "",
    confirm_email: "",
    phone: "",
    hear_about: "Agent/Broker",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipcode: "",
    reside_from_month: "01",
    reside_from_year: "",
    monthly_rent: "",
    monthly_mortgage: "",
    landlord_name: "",
    landlord_phone: "",
    landlord_email: "",
    reason_for_leaving: "",
    has_adults: false,
    adult_count: 1,
    adult_names: [""],
    adult_emails: [""],
    adult_phones: [""],
    has_dependents: false,
    dependent_first_name: "",
    dependent_last_name: "",
    dependent_relation: "",
    dep_month: "",
    dep_day: "",
    dep_year: "",
    has_pets: false,
    pet_count: 1,
    pet_names: [""],
    pet_breeds: [""],
    pet_weights: [""],
    pet_ages: [""],
    dob_month: "",
    dob_day: "",
    dob_year: "",
    license_number: "",
    license_state: "",
    personal_email: "",
    personal_phone: "",
    emergency_name: "",
    emergency_phone: "",
    emergency_relation: "",
    ssn: "",
    has_vehicle: false,
    vehicle_make: "",
    vehicle_modal: "",
    vehicle_color: "",
    vehicle_year: "",
    vehicle_license: "",
    employer_name: "",
    employer_address1: "",
    employer_address2: "",
    employer_city: "",
    employer_state: "",
    employer_zip: "",
    employer_phone: "",
    monthly_salary: "",
    position: "",
    years_worked: "",
    supervisor_name: "",
    eviction_history: "no",
    eviction_explain: "",
    criminal_history: "no",
    criminal_explain: "",
    income_3x: "yes",
    income_explain: "",
    employment_history: "yes",
    employment_explain: "",
    residency_history: "yes",
    residency_explain: "",
    billing_first_name: "",
    billing_last_name: "",
    billing_address1: "",
    billing_address2: "",
    billing_city: "",
    billing_state: "",
    billing_zip: "",
    billing_country: "US",
    agree_terms: true,
    authorized_name: "",
    payment_method: "card",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sdkStatus, setSdkStatus] = useState("");
  const [sdkTone, setSdkTone] = useState("info");
  const [formError, setFormError] = useState("");
  const stripeRef = useRef(null);
  const cardNumberRef = useRef(null);
  const cardExpiryRef = useRef(null);
  const cardCvcRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (currentStep === 0 && dateRef.current && window.flatpickr) {
      window.flatpickr(dateRef.current, {
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange(_, dateStr) {
          setForm((p) => ({ ...p, move_in_date: dateStr }));
        },
      });
    }
  }, [currentStep]);

  function mountStripe() {
    if (stripeRef.current || !window.Stripe) return;
    stripeRef.current = window.Stripe(stripePublicKey);
    const elements = stripeRef.current.elements();
    const style = { base: { fontSize: "16px", color: "#32325d" } };
    cardNumberRef.current = elements.create("cardNumber", { style });
    cardExpiryRef.current = elements.create("cardExpiry", { style });
    cardCvcRef.current = elements.create("cardCvc", { style });
    setTimeout(() => {
      const numEl = document.getElementById("card-number-element");
      const expEl = document.getElementById("card-expiry-element");
      const cvcEl = document.getElementById("card-cvc-element");
      if (numEl) cardNumberRef.current.mount("#card-number-element");
      if (expEl) cardExpiryRef.current.mount("#card-expiry-element");
      if (cvcEl) cardCvcRef.current.mount("#card-cvc-element");
    }, 100);
  }

  useEffect(() => {
    if (currentStep === 9) mountStripe();
  }, [currentStep]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (formError) setFormError("");
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function handleArrayChange(field, idx, value) {
    if (formError) setFormError("");
    setForm((p) => {
      const arr = [...p[field]];
      arr[idx] = value;
      return { ...p, [field]: arr };
    });
  }

  function isBlank(v) {
    return v === undefined || v === null || String(v).trim() === "";
  }

  function validateStep(stepIndex) {
    const missing = [];

    if (stepIndex === 0) {
      if (isBlank(form.property_id)) missing.push("Property");
      if (isBlank(form.move_in_date)) missing.push("Desired Move-in");
    }

    if (stepIndex === 1) {
      if (isBlank(form.first_name)) missing.push("First Name");
      if (isBlank(form.last_name)) missing.push("Last Name");
      if (isBlank(form.email)) missing.push("Email");
      if (isBlank(form.confirm_email)) missing.push("Confirm Email");
      if (isBlank(form.phone)) missing.push("Phone");
      if (
        !isBlank(form.email) &&
        !isBlank(form.confirm_email) &&
        form.email !== form.confirm_email
      ) {
        setFormError("Email and Confirm Email must match.");
        return false;
      }
    }

    if (stepIndex === 4) {
      if (isBlank(form.ssn)) missing.push("Social Security Number (SSN)");
    }

    if (stepIndex === 7 && !photoFile) {
      missing.push("Photo ID");
    }

    if (stepIndex === 8) {
      if (isBlank(form.billing_first_name)) missing.push("Billing First Name");
      if (isBlank(form.billing_last_name)) missing.push("Billing Last Name");
      if (isBlank(form.billing_address1))
        missing.push("Billing Address Line 1");
      if (isBlank(form.billing_city)) missing.push("Billing City");
      if (isBlank(form.billing_state)) missing.push("Billing State");
      if (isBlank(form.billing_zip)) missing.push("Billing Zip Code");
    }

    if (stepIndex === 9 && !form.agree_terms) {
      missing.push("Terms agreement");
    }

    if (missing.length > 0) {
      setFormError(`Please complete required fields: ${missing.join(", ")}.`);
      return false;
    }

    setFormError("");
    return true;
  }

  function validateAllRequiredForPayment() {
    const stepsToCheck = [0, 1, 4, 7, 8, 9];
    for (const stepIndex of stepsToCheck) {
      if (!validateStep(stepIndex)) return false;
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, 9));
  }
  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function buildFormData() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
      else fd.append(k, v);
    });
    if (photoFile) fd.append("photo_id", photoFile);
    return fd;
  }

  async function submitWithCard() {
    if (submitting) return;
    if (!validateAllRequiredForPayment()) return;
    if (!stripePublicKey || !window.Stripe) {
      setSdkStatus(
        "Card payment is not ready. Please refresh and try again, or use PayPal.",
      );
      setSdkTone("error");
      return;
    }
    setSubmitting(true);
    setSdkStatus("Submitting your application and preparing card payment...");
    setSdkTone("info");
    try {
      const authorizedName =
        form.authorized_name || `${form.first_name} ${form.last_name}`.trim();
      const pmResult = await stripeRef.current.createPaymentMethod({
        type: "card",
        card: cardNumberRef.current,
        billing_details: { name: authorizedName, email: form.email },
      });
      if (pmResult.error) {
        setSdkStatus(pmResult.error.message);
        setSdkTone("error");
        setSubmitting(false);
        return;
      }
      const fd = buildFormData();
      fd.set("payment_method", "card");
      fd.set("stripe_payment_method_id", pmResult.paymentMethod.id);
      const res = await fetch("/api/applying", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        setSdkStatus(result.error || "Payment failed");
        setSdkTone("error");
        return;
      }
      if (result.status === "requires_action") {
        setSdkStatus("Please complete the card verification to continue.");
        const confirm = await stripeRef.current.confirmCardPayment(
          result.payment_intent_client_secret,
        );
        if (confirm.error) {
          setSdkStatus(confirm.error.message);
          setSdkTone("error");
          setSubmitting(false);
          return;
        }
        const piId = confirm.paymentIntent?.id;
        if (piId) {
          const fin = await fetch("/api/applying/finalize-stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_intent_id: piId }),
          });
          const finJson = await fin.json();
          if (!fin.ok || finJson.status !== "succeeded") {
            setSdkStatus(
              finJson.error ||
                "Payment succeeded but we could not save your application. Please contact support.",
            );
            setSdkTone("error");
            setSubmitting(false);
            return;
          }
          router.push(finJson.redirect_url || "/success");
          return;
        }
      } else if (result.status === "succeeded") {
        router.push(result.redirect_url || "/success");
      } else {
        setSdkStatus(result.error || "Payment failed");
        setSdkTone("error");
      }
    } catch (err) {
      setSdkStatus(err.message || "Something went wrong.");
      setSdkTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWithPaypal() {
    if (submitting) return;
    if (!validateAllRequiredForPayment()) return;
    setSubmitting(true);
    setSdkStatus("Submitting your application and preparing checkout...");
    setSdkTone("info");
    try {
      const fd = buildFormData();
      fd.set("payment_method", "paypal");
      const res = await fetch("/api/applying", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) {
        setSdkStatus(result.error || "Payment failed");
        setSdkTone("error");
        return;
      }
      if (result.status === "paypal_redirect") {
        window.location.href = result.redirect_url;
      } else if (result.status === "succeeded") {
        router.push(result.redirect_url || "/success");
      } else {
        setSdkStatus(result.error || "Payment failed");
        setSdkTone("error");
      }
    } catch (err) {
      setSdkStatus(err.message || "Something went wrong.");
      setSdkTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  const venmoContainerRef = useRef(null);
  const venmoRenderedRef = useRef(false);

  useEffect(() => {
    if (currentStep !== 9 || venmoRenderedRef.current) return;
    if (!window.paypal || !venmoContainerRef.current) return;

    const btnConfig = {
      fundingSource: window.paypal.FUNDING.VENMO,
      style: { layout: "vertical", shape: "pill", height: 50 },
      onClick(_data, actions) {
        if (submitting) return actions.reject();
        if (!validateAllRequiredForPayment()) {
          setSdkStatus(
            "Please complete all required fields before starting Venmo checkout.",
          );
          setSdkTone("error");
          return actions.reject();
        }
        setSubmitting(true);
        setSdkStatus("Submitting your application and opening Venmo...");
        setSdkTone("info");
        return actions.resolve();
      },
      async createOrder() {
        const fd = buildFormData();
        fd.set("payment_method", "venmo");
        const res = await fetch("/api/applying/venmo/create", {
          method: "POST",
          body: fd,
        });
        const result = await res.json();
        if (!res.ok || result.status !== "created") {
          setSubmitting(false);
          setSdkStatus(result.error || "Unable to initialize Venmo checkout.");
          setSdkTone("error");
          throw new Error(result.error || "Unable to initialize Venmo.");
        }
        venmoContainerRef.current.dataset.draftToken = result.draft_token;
        return result.order_id;
      },
      async onApprove(data) {
        const draftToken = venmoContainerRef.current?.dataset.draftToken;
        const res = await fetch("/api/applying/venmo/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.orderID,
            draft_token: draftToken,
          }),
        });
        const result = await res.json();
        if (!res.ok || result.status !== "succeeded") {
          setSubmitting(false);
          setSdkStatus(result.error || "Unable to confirm the Venmo payment.");
          setSdkTone("error");
          return;
        }
        window.location.href = result.redirect_url;
      },
      onCancel() {
        setSubmitting(false);
        setSdkStatus(
          "Venmo checkout was canceled. Nothing is saved until payment completes.",
        );
        setSdkTone("info");
      },
      onError() {
        setSubmitting(false);
        setSdkStatus(
          "Venmo checkout failed. Please try again or use PayPal or card.",
        );
        setSdkTone("error");
      },
    };

    const btn = window.paypal.Buttons(btnConfig);
    if (btn.isEligible()) {
      btn.render(venmoContainerRef.current);
      venmoRenderedRef.current = true;
    }
  }, [currentStep]);

  const totalSteps = 10;

  return (
    <>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onLoad={() => {
          if (currentStep === 9) mountStripe();
        }}
      />
      {paypalClientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture&components=buttons&enable-funding=venmo`}
          strategy="afterInteractive"
        />
      )}
      <section className="ph-page-shell">
        <div className="ph-page-hero">
          <div className="ph-page-hero__inner">
            <p className="ph-page-hero__title ph-page-hero__title--applying">
              Applying
            </p>
            <div className="ph-page-hero__crumbs">
              <span>Home</span>
              <i className="fas fa-angle-right"></i>
              <span>Applying</span>
            </div>
          </div>
        </div>

        <div className="ph-page-hero__content">
          <div
            id="multi-step-form"
            className="container mt-5 applyingFormShell"
          >
            <div className="applyingFormCard">
              {/* Progress Bar */}
              <div className="d-flex gap-2 mb-4 applyingProgress">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`progress-step ${i <= currentStep ? "progress-step-active" : ""}`}
                  />
                ))}
              </div>

              {formError && (
                <div className="alert alert-danger py-2" role="alert">
                  {formError}
                </div>
              )}

              {/* Step 1: Property Selection */}
              {currentStep === 0 && (
                <div className="form-step form-step-active">
                  <h5 className="paraHeading">ONLINE APPLICATION PROCESS:</h5>
                  <p className="m-0 paraDetail">
                    Thank you for choosing a property offered by Purple Housing
                    as your new home. In order to make the application process
                    easier, please follow the directions below. WHEN MULTIPLE
                    APPLICANTS APPLY FOR A PROPERTY, EACH APPLICANT IS EVALUATED
                    SEPARATELY AND EACH MUST MEET THE QUALIFYING CRITERIA. The
                    Property Owner(s) have the right of final approval of
                    applications.
                    <br />
                    <br />
                    Each prospective tenant and occupant 18 years of age or
                    older must submit a separate application (including each
                    spouse if married). Cosigners and Guarantors must also
                    submit a complete application.
                    <br />
                    <br />
                    The following Application Agreement will be signed by all
                    applicants prior to signing a lease contract.
                  </p>
                  <p className="m-0 fw-bold my-3">Application fee: $50.00</p>
                  <div className="mb-3">
                    <label className="form-label">
                      Property <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      name="property_id"
                      value={form.property_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select Property
                      </option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.prop_title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Desired Move-in <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      ref={dateRef}
                      type="text"
                      className="form-control"
                      placeholder="Select Date"
                      name="move_in_date"
                      value={form.move_in_date}
                      readOnly
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="applicant_type"
                        value="tenant"
                        checked={form.applicant_type === "tenant"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        I am applying as a tenant. (I will be living on the
                        property.)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="applicant_type"
                        value="cosigner"
                        checked={form.applicant_type === "cosigner"}
                        onChange={handleChange}
                      />
                      <label className="form-check-label">
                        I am applying as a co-signer/guarantor for another
                        applicant.
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 2: Contact Info */}
              {currentStep === 1 && (
                <div className="form-step form-step-active">
                  <p>Your Contact Info</p>
                  <div className="mb-3">
                    <label className="form-label">
                      Name <span className="text-danger">*</span>
                    </label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          name="first_name"
                          placeholder="First Name"
                          value={form.first_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          name="last_name"
                          placeholder="Last Name"
                          value={form.last_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          placeholder="Email"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="email"
                          className="form-control"
                          name="confirm_email"
                          placeholder="Confirm Email"
                          value={form.confirm_email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    {form.email &&
                      form.confirm_email &&
                      form.email !== form.confirm_email && (
                        <div className="text-danger small mt-1">
                          Emails do not match.
                        </div>
                      )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      placeholder="Number"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">
                      How did you hear about us?
                    </label>
                    <select
                      className="form-select"
                      name="hear_about"
                      value={form.hear_about}
                      onChange={handleChange}
                    >
                      {HEAR_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 3: Where you've lived */}
              {currentStep === 2 && (
                <div className="form-step form-step-active">
                  <h5 className="mb-3">Where you&apos;ve lived</h5>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      name="address1"
                      placeholder="Address 1"
                      value={form.address1}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      name="address2"
                      placeholder="Address 2"
                      value={form.address2}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {STATE_CHOICES.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control w-50"
                      name="zipcode"
                      placeholder="Zip Code"
                      value={form.zipcode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Resided From (Month)</label>
                      <select
                        className="form-select"
                        name="reside_from_month"
                        value={form.reside_from_month}
                        onChange={handleChange}
                      >
                        {MONTHS.map((m, i) => (
                          <option
                            key={m}
                            value={String(i + 1).padStart(2, "0")}
                          >
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Select Year</label>
                      <select
                        className="form-select"
                        name="reside_from_year"
                        value={form.reside_from_year}
                        onChange={handleChange}
                      >
                        <option disabled value="">
                          Year
                        </option>
                        {YEARS.filter(
                          (y) => y <= new Date().getFullYear() && y >= 1990,
                        ).map((y) => (
                          <option key={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Monthly Mortgage</label>
                    <input
                      type="text"
                      className="form-control"
                      name="monthly_rent"
                      placeholder="Monthly Rent"
                      value={form.monthly_rent}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Homeowner Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="landlord_name"
                        placeholder="Landlord Name"
                        value={form.landlord_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Homeowner Phone Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="landlord_phone"
                        placeholder="Phone Number"
                        value={form.landlord_phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Homeowner Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="landlord_email"
                      placeholder="Email Address"
                      value={form.landlord_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">
                      Reason For Leaving (if any)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="reason_for_leaving"
                      value={form.reason_for_leaving}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 4: Housemates & Pets */}
              {currentStep === 3 && (
                <div className="form-step form-step-active">
                  <h5>Your Housemates</h5>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Other Occupants
                    </label>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={form.has_adults}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                has_adults: e.target.checked,
                              }))
                            }
                          />
                          <label className="form-check-label">
                            I am applying with other adults 18 and older
                          </label>
                        </div>
                        {form.has_adults && (
                          <div className="mt-2">
                            <label className="form-label fw-semibold">
                              No. of Adults
                            </label>
                            <select
                              className="form-select"
                              value={form.adult_count}
                              onChange={(e) => {
                                const count = parseInt(e.target.value);
                                setForm((p) => ({
                                  ...p,
                                  adult_count: count,
                                  adult_names: Array.from(
                                    { length: count },
                                    (_, i) => p.adult_names[i] || "",
                                  ),
                                  adult_emails: Array.from(
                                    { length: count },
                                    (_, i) => p.adult_emails[i] || "",
                                  ),
                                  adult_phones: Array.from(
                                    { length: count },
                                    (_, i) => p.adult_phones[i] || "",
                                  ),
                                }));
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                            {Array.from(
                              { length: form.adult_count },
                              (_, i) => (
                                <div key={i} className="row g-3 mt-2">
                                  <div className="col-md-4">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Adult Name"
                                      value={form.adult_names[i] || ""}
                                      onChange={(e) =>
                                        handleArrayChange(
                                          "adult_names",
                                          i,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-4">
                                    <input
                                      type="email"
                                      className="form-control"
                                      placeholder="Adult Email"
                                      value={form.adult_emails[i] || ""}
                                      onChange={(e) =>
                                        handleArrayChange(
                                          "adult_emails",
                                          i,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-4">
                                    <input
                                      type="tel"
                                      className="form-control"
                                      placeholder="Adult Phone"
                                      value={form.adult_phones[i] || ""}
                                      onChange={(e) =>
                                        handleArrayChange(
                                          "adult_phones",
                                          i,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={form.has_dependents}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                has_dependents: e.target.checked,
                              }))
                            }
                          />
                          <label className="form-check-label">
                            I will have dependents living with me who are under
                            18
                          </label>
                        </div>
                        {form.has_dependents && (
                          <div className="mt-2">
                            <div className="row g-2 mb-2">
                              <div className="col">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="First Name"
                                  name="dependent_first_name"
                                  value={form.dependent_first_name}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="col">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Last Name"
                                  name="dependent_last_name"
                                  value={form.dependent_last_name}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                            <div className="mb-2">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Relationship"
                                name="dependent_relation"
                                value={form.dependent_relation}
                                onChange={handleChange}
                              />
                            </div>
                            <label className="form-label fw-semibold">
                              Date of Birth
                            </label>
                            <div className="row g-2">
                              <div className="col">
                                <select
                                  className="form-select"
                                  name="dep_month"
                                  value={form.dep_month}
                                  onChange={handleChange}
                                >
                                  <option disabled value="">
                                    MM
                                  </option>
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1,
                                  ).map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col">
                                <select
                                  className="form-select"
                                  name="dep_day"
                                  value={form.dep_day}
                                  onChange={handleChange}
                                >
                                  <option disabled value="">
                                    DD
                                  </option>
                                  {DAYS.map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col">
                                <select
                                  className="form-select"
                                  name="dep_year"
                                  value={form.dep_year}
                                  onChange={handleChange}
                                >
                                  <option disabled value="">
                                    YYYY
                                  </option>
                                  {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                      {y}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="row my-4">
                      <h5>PETS</h5>
                      <div className="form-check my-3 mx-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={form.has_pets}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              has_pets: e.target.checked,
                            }))
                          }
                        />
                        <label className="form-check-label">I have pets.</label>
                      </div>
                      {form.has_pets && (
                        <div>
                          <label className="form-label fw-semibold">
                            No. of Pets
                          </label>
                          <select
                            className="form-select"
                            value={form.pet_count}
                            onChange={(e) => {
                              const count = parseInt(e.target.value);
                              setForm((p) => ({
                                ...p,
                                pet_count: count,
                                pet_names: Array.from(
                                  { length: count },
                                  (_, i) => p.pet_names[i] || "",
                                ),
                                pet_breeds: Array.from(
                                  { length: count },
                                  (_, i) => p.pet_breeds[i] || "",
                                ),
                                pet_weights: Array.from(
                                  { length: count },
                                  (_, i) => p.pet_weights[i] || "",
                                ),
                                pet_ages: Array.from(
                                  { length: count },
                                  (_, i) => p.pet_ages[i] || "",
                                ),
                              }));
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          {Array.from({ length: form.pet_count }, (_, i) => (
                            <div key={i} className="row g-3 mt-2">
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Pet Name"
                                  value={form.pet_names[i] || ""}
                                  onChange={(e) =>
                                    handleArrayChange(
                                      "pet_names",
                                      i,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type/Breed"
                                  value={form.pet_breeds[i] || ""}
                                  onChange={(e) =>
                                    handleArrayChange(
                                      "pet_breeds",
                                      i,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Weight (lbs)"
                                  value={form.pet_weights[i] || ""}
                                  onChange={(e) =>
                                    handleArrayChange(
                                      "pet_weights",
                                      i,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Age"
                                  value={form.pet_ages[i] || ""}
                                  onChange={(e) =>
                                    handleArrayChange(
                                      "pet_ages",
                                      i,
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 5: Personal Info & Vehicles */}
              {currentStep === 4 && (
                <div className="form-step form-step-active">
                  <div className="p-0">
                    <div className="row g-3">
                      <h5>Personal Information</h5>
                      <div className="col-md-12">
                        <label className="form-label fw-semibold">
                          Date of Birth
                        </label>
                        <div className="d-flex gap-2">
                          <select
                            className="form-select"
                            name="dob_month"
                            value={form.dob_month}
                            onChange={handleChange}
                          >
                            <option disabled value="">
                              MM
                            </option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (m) => (
                                <option key={m}>{m}</option>
                              ),
                            )}
                          </select>
                          <select
                            className="form-select"
                            name="dob_day"
                            value={form.dob_day}
                            onChange={handleChange}
                          >
                            <option disabled value="">
                              DD
                            </option>
                            {DAYS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                          <select
                            className="form-select"
                            name="dob_year"
                            value={form.dob_year}
                            onChange={handleChange}
                          >
                            <option disabled value="">
                              YYYY
                            </option>
                            {YEARS.map((y) => (
                              <option key={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Drivers License
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="license_number"
                            value={form.license_number}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Drivers License State
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="license_state"
                            value={form.license_state}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            name="personal_email"
                            value={form.personal_email}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Emergency Phone
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            name="personal_phone"
                            value={form.personal_phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Emergency Contact
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="emergency_name"
                            value={form.emergency_name}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Emergency Phone
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            name="emergency_phone"
                            value={form.emergency_phone}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Your Relation
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="emergency_relation"
                            value={form.emergency_relation}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Social Security Number (SSN){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="ssn"
                            value={form.ssn}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="row">
                        <h5>Vehicles</h5>
                        <div className="col-md-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={form.has_vehicle}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  has_vehicle: e.target.checked,
                                }))
                              }
                            />
                            <label className="form-check-label">
                              I have one or more vehicle
                            </label>
                          </div>
                          {form.has_vehicle && (
                            <div className="row mt-2">
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label fw-semibold">
                                    Make
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="vehicle_make"
                                    value={form.vehicle_make}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label fw-semibold">
                                    Color
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="vehicle_color"
                                    value={form.vehicle_color}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label fw-semibold">
                                    License Number
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="vehicle_license"
                                    value={form.vehicle_license}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label fw-semibold">
                                    Model
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="vehicle_modal"
                                    value={form.vehicle_modal}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label fw-semibold">
                                    Year
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="vehicle_year"
                                    value={form.vehicle_year}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 6: Employment */}
              {currentStep === 5 && (
                <div className="form-step form-step-active">
                  <div className="row">
                    <h5>Personal Income</h5>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">
                        Employer Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="employer_name"
                        value={form.employer_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Employer Address
                      </label>
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          name="employer_address1"
                          placeholder="Address 1"
                          value={form.employer_address1}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          name="employer_address2"
                          placeholder="Address 2"
                          value={form.employer_address2}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            name="employer_city"
                            placeholder="City"
                            value={form.employer_city}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <select
                            className="form-select"
                            name="employer_state"
                            value={form.employer_state}
                            onChange={handleChange}
                          >
                            <option value="" disabled>
                              Select State
                            </option>
                            {STATE_CHOICES.map(([code, name]) => (
                              <option key={code} value={code}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            name="employer_zip"
                            placeholder="Zip Code"
                            value={form.employer_zip}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="row g-3 my-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Employer Phone Number
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            name="employer_phone"
                            value={form.employer_phone}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Monthly Salary
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="monthly_salary"
                            value={form.monthly_salary}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Position Held
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Years Worked
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="years_worked"
                            value={form.years_worked}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label fw-semibold">
                            Supervisor Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="supervisor_name"
                            value={form.supervisor_name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 7: Questions */}
              {currentStep === 6 && (
                <div className="form-step form-step-active">
                  <div className="row">
                    <h5>Questions</h5>
                    {[
                      {
                        label:
                          "Have you ever been a defendant in an unlawful detainer (eviction) lawsuit?",
                        field: "eviction_history",
                        explainField: "eviction_explain",
                        defaultVal: "no",
                      },
                      {
                        label: "Have you ever been convicted of a crime?",
                        field: "criminal_history",
                        explainField: "criminal_explain",
                        defaultVal: "no",
                      },
                      {
                        label:
                          "Can you provide verifiable monthly income of at least 3 times the amount of monthly rent?",
                        field: "income_3x",
                        explainField: "income_explain",
                        defaultVal: "yes",
                      },
                      {
                        label:
                          "Can you provide current, verifiable employment and two years' employment history?",
                        field: "employment_history",
                        explainField: "employment_explain",
                        defaultVal: "yes",
                      },
                      {
                        label:
                          "Can you provide three years of verifiable residency history?",
                        field: "residency_history",
                        explainField: "residency_explain",
                        defaultVal: "yes",
                      },
                    ].map((q) => (
                      <div key={q.field} className="col-12 mb-3">
                        <label className="form-label fw-semibold">
                          {q.label} <span className="text-danger">*</span>
                        </label>
                        <div className="row g-2">
                          <div className="col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={q.field}
                                value="no"
                                checked={form[q.field] === "no"}
                                onChange={handleChange}
                              />
                              <label className="form-check-label">No</label>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={q.field}
                                value="yes"
                                checked={form[q.field] === "yes"}
                                onChange={handleChange}
                              />
                              <label className="form-check-label">Yes</label>
                            </div>
                          </div>
                        </div>
                        <h6>Please explain:</h6>
                        <textarea
                          className="form-control mt-2"
                          name={q.explainField}
                          value={form[q.explainField]}
                          onChange={handleChange}
                        ></textarea>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 8: Photo ID */}
              {currentStep === 7 && (
                <div className="form-step form-step-active">
                  <div className="row">
                    <h5>Attach Documents</h5>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Attach Photo ID <span className="text-danger">*</span>
                      </label>
                      <div className="mb-2">
                        <input
                          className="form-control"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt"
                          required
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.size > 10 * 1024 * 1024) {
                              alert(
                                "Please upload a file that is 10 MB or smaller.",
                              );
                              e.target.value = "";
                              return;
                            }
                            if (formError) setFormError("");
                            setPhotoFile(file || null);
                          }}
                        />
                      </div>
                      <div className="form-text">
                        Please upload your photo ID. Allowed formats: jpg, jpeg,
                        png, pdf, doc, docx, ppt. Maximum size: 10 MB.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 9: Billing Info */}
              {currentStep === 8 && (
                <div className="form-step form-step-active">
                  <div className="row">
                    <h5>Pay Application Fee</h5>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Name <span className="text-danger">*</span>
                      </label>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            name="billing_first_name"
                            placeholder="First"
                            value={form.billing_first_name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            name="billing_last_name"
                            placeholder="Last"
                            value={form.billing_last_name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-text">Your Billing Information</div>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Billing Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          name="billing_address1"
                          placeholder="Address Line 1"
                          value={form.billing_address1}
                          onChange={handleChange}
                          required
                        />
                        <input
                          type="text"
                          className="form-control mb-2"
                          name="billing_address2"
                          placeholder="Address Line 2"
                          value={form.billing_address2}
                          onChange={handleChange}
                        />
                        <div className="row g-2">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              name="billing_city"
                              placeholder="City"
                              value={form.billing_city}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <select
                              className="form-select"
                              name="billing_state"
                              value={form.billing_state}
                              onChange={handleChange}
                              required
                            >
                              <option value="" disabled>
                                Select State
                              </option>
                              {STATE_CHOICES.map(([code, name]) => (
                                <option key={code} value={code}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <input
                              type="text"
                              className="form-control"
                              name="billing_zip"
                              placeholder="Zip Code"
                              value={form.billing_zip}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-prev prev-btn"
                    onClick={prevStep}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-next next-btn"
                    onClick={nextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 10: Terms & Payment */}
              {currentStep === 9 && (
                <div className="form-step form-step-active">
                  <div className="row">
                    <h6>Purple Housing</h6>
                    <p>LEASING QUALIFICATIONS</p>
                    <p>
                      The following items are the leasing qualifications which
                      each applicant must meet:
                    </p>
                    <p>
                      1. Income: You must verify that you have monthly income of
                      at least three times the amount of monthly rent.
                    </p>
                    <p>
                      2. Employment: You must have current, verifiable
                      employment and two years&apos; employment history unless
                      self employed.
                    </p>
                    <p>
                      3. Credit History: We will process a credit report for
                      each applicant.
                    </p>
                    <p>
                      4. Rental History: You must provide three years of
                      verifiable residency.
                    </p>
                    <p>
                      5. Application Rejection: Your application may be rejected
                      for any of several reasons including eviction by a prior
                      landlord, outstanding debt, undisclosed criminal record,
                      false information, etc.
                    </p>
                    <hr />
                    <h6>Applicant Authorization</h6>
                    <p>
                      By checking the box and electronically signing your full
                      name below, you declare that all your statements in this
                      application are true and complete.
                    </p>
                    <hr />

                    <div className="mb-3 form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="agree_terms"
                        checked={form.agree_terms}
                        onChange={handleChange}
                        required
                      />
                      <label className="form-check-label">
                        I have received and read a copy of the Terms of
                        Agreement shown above. I have also received and read a
                        copy of the Summary of Your Rights Under The Fair Credit
                        Reporting Act.
                      </label>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Payment Method:</label>
                      <div className="payment-method-buttons payment-method-buttons--sdk">
                        {sdkStatus && (
                          <div
                            className={`payment-sdk-status payment-sdk-status--${sdkTone}`}
                          >
                            {sdkStatus}
                          </div>
                        )}
                        <div
                          ref={venmoContainerRef}
                          id="venmo-button-container"
                          style={{ minHeight: "50px" }}
                        ></div>
                        <button
                          type="button"
                          className="payment-method-btn payment-method-btn--paypal"
                          onClick={submitWithPaypal}
                          disabled={submitting}
                        >
                          <span className="payment-method-btn__icon">
                            <i className="fab fa-paypal"></i>
                          </span>
                          <span className="payment-method-btn__label">
                            {submitting ? "Redirecting..." : "PayPal"}
                          </span>
                        </button>
                        <div className="payment-divider">
                          <span>Or pay by card</span>
                        </div>
                        <div className="payment-card-heading">
                          <span className="payment-method-btn__icon">
                            <i className="fa fa-credit-card"></i>
                          </span>
                          <span className="payment-method-btn__label">
                            Card
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stripe Card */}
                    <div id="stripe-card-container" className="mb-3">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <label>Card Number</label>
                          <div
                            id="card-number-element"
                            className="stripe-input"
                            style={{
                              border: "1px solid #ccc",
                              padding: "10px",
                              borderRadius: "5px",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <label>Expiry Date</label>
                          <div
                            id="card-expiry-element"
                            className="stripe-input"
                            style={{
                              border: "1px solid #ccc",
                              padding: "10px",
                              borderRadius: "5px",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <label>CVC</label>
                          <div
                            id="card-cvc-element"
                            className="stripe-input"
                            style={{
                              border: "1px solid #ccc",
                              padding: "10px",
                              borderRadius: "5px",
                            }}
                          ></div>
                        </div>
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <label>Country</label>
                        <select
                          name="billing_country"
                          className="form-select"
                          value={form.billing_country}
                          onChange={handleChange}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Authorized/Acknowledged by (Type your Full Name below):
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="authorized_name"
                        placeholder="Type your full name here..."
                        value={form.authorized_name}
                        onChange={handleChange}
                      />
                      <p className="payment-authorization-note mb-0">
                        This full name acts as your electronic signature. If you
                        leave it blank, we will use the applicant name you
                        entered earlier before continuing to payment.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-next"
                    onClick={submitWithCard}
                    disabled={submitting}
                  >
                    {submitting ? "Processing..." : "Submit with Card"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .payment-method-buttons {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 8px;
          width: min(100%, 420px);
        }
        .payment-method-btn {
          width: 100%;
          border: 0;
          border-radius: 999px;
          min-height: 58px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
        }
        .payment-method-btn--paypal {
          background: linear-gradient(135deg, #ffc439, #ffb703);
          color: #043263;
        }
        .payment-method-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }
        .payment-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #7b6885;
          font-size: 13px;
          text-transform: uppercase;
        }
        .payment-divider::before,
        .payment-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(37, 18, 49, 0.14);
        }
        .payment-card-heading {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 700;
          color: #251231;
        }
        .payment-sdk-status {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .payment-sdk-status--info {
          background: rgba(18, 89, 186, 0.08);
          color: #1259ba;
        }
        .payment-sdk-status--error {
          background: rgba(189, 35, 61, 0.08);
          color: #bd233d;
        }
        .payment-authorization-note {
          margin-top: 8px;
          font-size: 13px;
          color: #6b5c74;
        }
      `}</style>
    </>
  );
}

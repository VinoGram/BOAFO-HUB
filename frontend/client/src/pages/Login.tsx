import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { authApi, setToken } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/contexts/NotificationContext";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { usePaystackPayment } from "react-paystack";
import { useLoading } from "@/contexts/LoadingContext";


/* ── tiny helpers ── */
type Step =
  | "method"
  | "phone-entry"
  | "otp-verify"
  | "phone-name"
  | "email-form"
  | "forgot-email"
  | "forgot-otp"
  | "reset-password";

type Role = "customer" | "provider";

function LocationDot() {
  const [city, setCity] = useState("");
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        );
        const d = await r.json();
        setCity(d.address?.city || d.address?.town || d.address?.village || "");
      } catch {
        /* ignore */
      }
    });
  }, []);
  if (!city) return null;
  return (
    <span
      className="location-badge"
      style={{ fontSize: "0.75rem", marginBottom: "1rem", display: "inline-flex" }}
    >
      <svg
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      {city}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#FEC868" }}>{"★".repeat(n)}</span>;
}

export default function Login() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { addNotification } = useNotification();
  const { hideLoader } = useLoading();
  const [step, setStep] = useState<Step>("method");

  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"Premium" | "Gold" | "Diamond">("Premium");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const GHANA_REGIONS = [
    "Ashanti", "Greater Accra", "Eastern", "Central",
    "Western", "Western North", "Volta", "Oti",
    "Northern", "North East", "Savannah", "Bono",
    "Bono East", "Ahafo", "Upper East", "Upper West",
  ];
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  
  const [paystackRef, setPaystackRef] = useState(new Date().getTime().toString());
  const [pendingPlan, setPendingPlan] = useState<"Gold" | "Diamond" | null>(null);

  const paystackConfig = {
    reference: paystackRef,
    email: email || "provider@boafo.app",
    amount: pendingPlan === "Gold" ? 5000 : pendingPlan === "Diamond" ? 10000 : 0,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "YOUR_PAYSTACK_PUBLIC_KEY",
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  function handlePlanClick(p: "Premium" | "Gold" | "Diamond") {
    if (p === "Premium") {
      setPlan("Premium");
      setSelectedDistricts([]);
      return;
    }
    // Trigger Paystack immediately when Gold or Diamond is clicked
    setPendingPlan(p);
    setPaystackRef(new Date().getTime().toString());
    setTimeout(() => {
      initializePayment({
        onSuccess: () => {
          setPlan(p);
          setSelectedDistricts([]);
          setError("");
        },
        onClose: () => {
          setError("Payment cancelled. Please complete payment to select this plan.");
        },
      });
    }, 50); // small delay so paystackConfig picks up the new ref/amount
  }


  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me().catch(() => null),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (meLoading) return;
    if (me?.id) navigate("/dashboard");
  }, [me, meLoading]);

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);


  function startResendTimer() {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  class OtpController {
    constructor(
      private digits: string[],
      private setDigits: React.Dispatch<React.SetStateAction<string[]>>,
      private refs: React.MutableRefObject<(HTMLInputElement | null)[]>
    ) {}

    setDigit(index: number, rawValue: string) {
      const d = rawValue.replace(/\D/, "").slice(0, 1);
      const next = [...this.digits];
      next[index] = d;
      this.setDigits(next);
      if (d && index < 5) this.refs.current[index + 1]?.focus();
    }

    handleKey(index: number, e: React.KeyboardEvent) {
      if (e.key === "Backspace" && !this.digits[index] && index > 0) {
        this.refs.current[index - 1]?.focus();
      }
    }

    getCode() {
      return this.digits.join("");
    }

    isComplete() {
      return this.getCode().length >= 6;
    }
  }

  async function handleSendOTP(paymentSuccessful = false) {
    if (!phone.trim()) {
      setError("Enter a valid phone number");
      return;
    }

    // Payment is now handled at plan selection time; proceed directly

    setError("");    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setStep("otp-verify");
      startResendTimer();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    const controller = new OtpController(otp, setOtp, otpRefs);
    const code = controller.getCode();
    if (!controller.isComplete()) {
      setError("Enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(
        phone,
        code,
        {
          name,
          role,
          ...(role === "provider" && { plan, districts: selectedDistricts }),
        });
      if (res.user && !res.user.name) {
        setStep("phone-name");
        return;
      }
      if (res.token) setToken(res.token);
      qc.setQueryData(["auth", "me"], res.user);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneName() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const controller = new OtpController(otp, setOtp, otpRefs);
    const code = controller.getCode();

    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(
        phone,
        code,
        {
          name,
          role,
          ...(role === "provider" && { plan, districts: selectedDistricts }),
        });
      if (res.token) setToken(res.token);
      qc.setQueryData(["auth", "me"], res.user);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(e?: React.FormEvent, paymentSuccessful = false) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError("");

    // Payment is now handled at plan selection time; proceed directly

    setLoading(true);
    try {
      const res =
        authMode === "login" ?
        await authApi.login(email, password)
        : await (async () => {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("role", role);
            if (role === "provider") {
              if (plan) formData.append("plan", plan);
              if (selectedDistricts.length > 0) {
                formData.append("districts", selectedDistricts.join(","));
              }
            }
            if (profilePicture) {
              formData.append("profilePicture", profilePicture);
            }
            return authApi.register(formData);
          })();

      if (res.token) setToken(res.token);
      qc.setQueryData(["auth", "me"], res.user);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotRequest() {
    setError("");
    const em = forgotEmail.trim().toLowerCase();
    if (!em || !em.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      await authApi.passwordForgot(em);
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      alert(`An OTP has been sent to ${em}. Please check your email and phone.`);
      setStep("forgot-otp");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      setError("Enter the OTP");
      return;
    }

    if (forgotNewPassword.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    try {
      await authApi.passwordReset({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      });
      // After reset, go back to sign in
      setAuthMode("login");
      setEmail(forgotEmail);
      setPassword("");
      setStep("email-form");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setForgotLoading(false);
    }
  }

  function onEmojiClick(emojiData: EmojiClickData) {
    // In a real chat input, you would append this to the message state
    console.log(emojiData.emoji);
  }

  const PLAN_LIMITS: Record<string, number> = { Premium: 2, Gold: 8, Diamond: 16 };

  const handleDistrictChange = (district: string) => {
    setSelectedDistricts(prev => {
      if (prev.includes(district)) return prev.filter(d => d !== district);
      const limit = PLAN_LIMITS[plan] ?? 2;
      if (prev.length >= limit) {
        setError(`${plan} plan allows a maximum of ${limit} region${limit === 1 ? "" : "s"}.`);
        return prev;
      }
      setError("");
      return [...prev, district];
    });
  };

  const P = { fontFamily: "var(--font-apple)" };

  return (
    <div className="login-page">
      {/* ── Visual panel ── */}
      <div className="login-visual">
        <div
          style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff", maxWidth: 380 }}
        >
          <div style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "2.75rem", fontWeight: 700, marginBottom: "0.375rem" }}>
            BOAFO
          </div>
          <p style={{ opacity: 0.82, fontSize: "1rem", marginBottom: "2.5rem" }}>
            Ghana's trusted trades marketplace
          </p>

          <div
            style={{ background: "rgba(255,255,255,0.13)", borderRadius: "1.5rem", padding: "1.5rem", marginBottom: "1.75rem", textAlign: "left" }}
          >
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
              <div
                className="img-placeholder"
                style={{ width: 52, height: 52, minWidth: 52, borderRadius: "50%", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)" }}
              >
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>Photo</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Samuel Kofi</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>Certified Electrician · Accra</div>
                <Stars n={5} />
              </div>
              <div
                style={{ marginLeft: "auto", background: "#ABC270", borderRadius: "9999px", padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }}
              >
                Verified
              </div>
            </div>
            <div style={{ fontSize: "0.82rem", opacity: 0.8, lineHeight: 1.6 }}>
              "BOAFO made it easy to grow my client base. I get genuine job requests every week."
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
            {[["500+", "Verified Pros"], ["2k+", "Jobs Done"], ["4.8★", "Rating"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontWeight: 800, fontSize: "1.25rem" }}>{v}</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="login-neo" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#EEE8DF", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 440, padding: "2.5rem 2rem", ...P }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "1.5rem" }}>
            <span
              style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#ABC270,#8FA853)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}
            >
              B
            </span>
            <span style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33" }}>
              BOAFO
            </span>
          </Link>

          <LocationDot />

          {/* ── STEP: choose method ── */}
          {step === "method" && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>Welcome</h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
                How would you like to continue?
              </p>

              <div style={{ display: "flex", background: "#EEE8DF", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" }}>
                {(["customer", "provider"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      transition: "all 0.2s",
                      background: role === r ? "#EEE8DF" : "transparent",
                      color: role === r ? "#473C33" : "#6B5B4E",
                      boxShadow: role === r ? "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff" : "none",
                    }}
                  >
                    {r === "customer" ? "I need services" : "I offer services"}
                  </button>
                ))}
              </div>

              <button
                className="btn-boafo btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "0.9375rem", padding: "0.8rem", marginBottom: "0.875rem" }}
                onClick={() => setStep("phone-entry")}
              >
                Continue with Phone (SMS OTP)
              </button>
              <button
                style={{ width: "100%", justifyContent: "center", fontSize: "0.9375rem", padding: "0.8rem", background: "#EEE8DF", border: "none", borderRadius: "0.75rem", fontWeight: 600, color: "#473C33", cursor: "pointer", boxShadow: "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff", display: "flex", alignItems: "center" }}
                onClick={() => {
                  setAuthMode("login");
                  setStep("email-form");
                }}
              >
                Continue with Email
              </button>
            </>
          )}

          {/* ── STEP: phone entry ── */}
          {step === "phone-entry" && (
            <>
              <button
                onClick={() => setStep("method")}
                style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", marginBottom: "1rem", padding: 0 }}
              >
                ← Back
              </button>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>Enter your phone</h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                We'll send a 6-digit code to verify you.
              </p>

              <label className="boafo-label">Phone Number</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <span
                  style={{ background: "#EEE8DF", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontWeight: 600, color: "#473C33", fontSize: "0.9rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <svg width="20" height="15" viewBox="0 0 20 15">
                    <rect width="20" height="15" fill="#006B3F"/>
                    <rect width="20" height="10" y="0" fill="#FCD116"/>
                    <rect width="20" height="5" y="0" fill="#CE1126"/>
                    <polygon points="10,9.5 8.5,11 9,9 7.5,8.5 9.5,8.5 10,6.5 10.5,8.5 12.5,8.5 11,9 11.5,11" fill="black"/>
                  </svg>
                  +233
                </span>
                <input
                  className="boafo-input"
                  type="tel"
                  placeholder="024 000 0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                />
              </div>
              <p style={{ fontSize: "0.775rem", color: "#6B5B4E", marginBottom: "1.5rem" }}>Starts with 0 for local numbers (e.g. 0244123456)</p>

              {role === "provider" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label className="boafo-label">Choose your plan</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                    {(["Premium", "Gold", "Diamond"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePlanClick(p)}
                        style={{
                          borderRadius: 12,
                          border: "none",
                          background: "#EEE8DF",
                          boxShadow: plan === p ? "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" : "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff",
                          padding: "0.9rem 0.85rem",
                          textAlign: "left",
                          cursor: "pointer",
                          outline: plan === p ? "2px solid #ABC270" : "none",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4, color: "#473C33" }}>{p}</div>
                        <div style={{ fontSize: "0.78rem", color: "#6B5B4E" }}>
                          {p === "Premium" ? "Free · 2 regions" : p === "Gold" ? "GH₵50 · 8 regions" : "GH₵100 · All regions"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {role === "provider" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label className="boafo-label">Select your operational regions ({selectedDistricts.length}/{PLAN_LIMITS[plan]})</label>
                  {plan === "Diamond" && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => setSelectedDistricts(e.target.checked ? GHANA_REGIONS : [])}
                          checked={selectedDistricts.length === GHANA_REGIONS.length}
                        />
                        Select All Regions
                      </label>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', borderRadius: '12px', padding: '1rem', background: "#EEE8DF", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" }}>
                    {GHANA_REGIONS.map(r => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#473C33' }}>
                        <input type="checkbox" value={r} checked={selectedDistricts.includes(r)} onChange={() => handleDistrictChange(r)} />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <ErrBox msg={error} />}

              <button
                className="btn-boafo btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.8rem", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={() => handleSendOTP()}
              >
                {loading ? "Sending…" : "Send OTP Code"}
              </button>
            </>
          )}

          {/* ── STEP: OTP verify ── */}
          {step === "otp-verify" && (
            <>
              <button
                onClick={() => setStep("phone-entry")}
                style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", marginBottom: "1rem", padding: 0 }}
              >
                ← Back
              </button>
              <h1 className="boafo-text-in" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>
                Verify your number
              </h1>

              <p className="boafo-text-in" style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
                {(() => {
                  const controller = new OtpController(otp, setOtp, otpRefs);
                  return otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => controller.setDigit(i, e.target.value)}
                      onKeyDown={(e) => controller.handleKey(i, e)}
                      className={d ? "boafo-otp-pop boafo-otp-shine" : "boafo-otp-shine"}
                      data-filled={d ? "true" : "false"}
                      style={{
                        width: 52,
                        height: 56,
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        border: "none",
                        borderRadius: "0.75rem",
                        background: "#EEE8DF",
                        color: "#473C33",
                        outline: d ? "2px solid #ABC270" : "none",
                        boxShadow: d ? "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" : "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff",
                        transition: "box-shadow 0.2s",
                        animationDelay: `${i * 35}ms`,
                      }}
                    />
                  ));
                })()}
              </div>

              {error && <ErrBox msg={error} />}

              <button
                className="btn-boafo btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.8rem", marginBottom: "0.875rem", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={handleVerifyOTP}
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#6B5B4E" }}>
                {resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  <button
                    style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => {
                      setStep("phone-entry");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                  >
                    Resend code
                  </button>
                )}
              </p>
            </>
          )}

          {/* ── STEP: ask for name ── */}
          {step === "phone-name" && (
            <>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>Almost there!</h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                Tell us your name so providers know who they're talking to.
              </p>

              <label className="boafo-label">Full Name</label>
              <input
                className="boafo-input"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: "1.5rem" }}
              />

              {error && <ErrBox msg={error} />}

              <button
                className="btn-boafo btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.8rem", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
                onClick={handlePhoneName}
              >
                {loading ? "Saving…" : "Finish Setup"}
              </button>
            </>
          )}

          {/* ── STEP: email form ── */}
          {step === "email-form" && (
            <>
              <button
                onClick={() => setStep("method")}
                style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", marginBottom: "1rem", padding: 0 }}
              >
                ← Back
              </button>

              <div style={{ display: "flex", background: "#EEE8DF", borderRadius: "0.75rem", padding: 4, marginBottom: "1.75rem", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" }}>
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAuthMode(m)}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      transition: "all 0.2s",
                      background: authMode === m ? "#EEE8DF" : "transparent",
                      color: authMode === m ? "#473C33" : "#6B5B4E",
                      boxShadow: authMode === m ? "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff" : "none",
                    }}
                  >
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.25rem" }}>
                {authMode === "login" ? "Welcome back" : "Join BOAFO"}
              </h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                {authMode === "login" ? "Sign in with your email" : "Create your free account"}
              </p>

              <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {authMode === "register" && (
                  <div>
                    <label className="boafo-label">Full Name</label>
                    <input className="boafo-input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}

                {authMode === 'register' && (
                  <div>
                    <label className="boafo-label">Profile Picture (Optional)</label>
                    <input
                      className="boafo-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfilePicture(e.target.files[0]);
                        } else {
                          setProfilePicture(null);
                        }
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="boafo-label">Email</label>
                  <input
                    className="boafo-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="boafo-label">Password</label>
                  <input
                    className="boafo-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {authMode === "login" && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotOtp("");
                        setForgotNewPassword("");
                        setForgotConfirmPassword("");
                        setError("");
                        setStep("forgot-email");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ABC270",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {authMode === "register" && (
                  <>
                    <div>
                      <label className="boafo-label">I am a…</label>
                      <select className="boafo-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                        <option value="customer">Customer — I need services</option>
                        <option value="provider">Provider — I offer services</option>
                      </select>
                    </div>

                    {role === "provider" && (
                      <div>
                        <label className="boafo-label">Choose your plan</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                          {(["Premium", "Gold", "Diamond"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handlePlanClick(p)}
                              style={{
                                borderRadius: 12,
                                border: "none",
                                background: "#EEE8DF",
                                boxShadow: plan === p ? "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" : "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff",
                                padding: "0.9rem 0.85rem",
                                textAlign: "left",
                                cursor: "pointer",
                                outline: plan === p ? "2px solid #ABC270" : "none",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 4, color: "#473C33" }}>{p}</div>
                              <div style={{ fontSize: "0.78rem", color: "#6B5B4E" }}>
                                {p === "Premium" ? "Free · 2 regions" : p === "Gold" ? "GH₵50 · 8 regions" : "GH₵100 · All regions"}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {role === "provider" && (
                      <div>
                        <label className="boafo-label">Select your operational regions ({selectedDistricts.length}/{PLAN_LIMITS[plan]})</label>
                        {plan === "Diamond" && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                onChange={(e) => setSelectedDistricts(e.target.checked ? GHANA_REGIONS : [])}
                                checked={selectedDistricts.length === GHANA_REGIONS.length}
                              />
                              Select All Regions
                            </label>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', borderRadius: '12px', padding: '1rem', background: "#EEE8DF", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" }}>
                          {GHANA_REGIONS.map(r => (
                            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#473C33' }}>
                              <input type="checkbox" value={r} checked={selectedDistricts.includes(r)} onChange={() => handleDistrictChange(r)} />
                              {r}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {error && <ErrBox msg={error} />}

                <button
                  type="submit"
                  className="btn-boafo btn-primary"
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center", padding: "0.8rem", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Please wait…" : authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: forgot-email ── */}
          {step === "forgot-email" && (
            <>
              <button
                onClick={() => setStep("email-form")}
                style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", marginBottom: "1rem", padding: 0 }}
              >
                ← Back
              </button>

              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>
                Reset your password
              </h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                Enter your email. We'll send an OTP to both email and phone.
              </p>

              <label className="boafo-label">Email</label>
              <input
                className="boafo-input"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                style={{ marginBottom: "1.5rem" }}
              />

              {error && <ErrBox msg={error} />}

              <button
                className="btn-boafo btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.8rem", opacity: forgotLoading ? 0.7 : 1 }}
                disabled={forgotLoading}
                onClick={handleForgotRequest}
              >
                {forgotLoading ? "Sending OTP…" : "Send OTP"}
              </button>
            </>
          )}

          {/* ── STEP: forgot-otp + reset ── */}
          {step === "forgot-otp" && (
            <>
              <button
                onClick={() => setStep("forgot-email")}
                style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", marginBottom: "1rem", padding: 0 }}
              >
                ← Back
              </button>

              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>
                Enter OTP & new password
              </h1>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.75rem" }}>
                OTP is valid for 10 minutes.
              </p>

              <form onSubmit={handleForgotVerifyAndReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="boafo-label">OTP</label>
                  <input
                    className="boafo-input"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div>
                  <label className="boafo-label">New Password</label>
                  <input
                    className="boafo-input"
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="New password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="boafo-label">Confirm Password</label>
                  <input
                    className="boafo-input"
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                {error && <ErrBox msg={error} />}

                <button
                  type="submit"
                  className="btn-boafo btn-primary"
                  disabled={forgotLoading}
                  style={{ width: "100%", justifyContent: "center", padding: "0.8rem", opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: "rgba(224,90,58,0.08)",
        border: "1px solid rgba(224,90,58,0.25)",
        borderRadius: "0.625rem",
        padding: "0.7rem 1rem",
        color: "#C0392B",
        fontSize: "0.875rem",
        fontWeight: 500,
        marginBottom: "1rem",
      }}
    >
      {msg}
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import { GlobalLoader } from "@/components/GlobalLoader";
import { useNavigation } from "@/hooks/useNavigation";
import { MapPin, Star, Zap, Shield, TrendingUp, Menu, X, Wrench, Bolt, Hammer, Wind, Home as HomeIcon, PaintBucket, Layers, Leaf, HardHat, User, Quote } from "lucide-react";

const NEO = "#EEE8DF";

// ── Helpers ───────────────────────────────────────────────────────────────

function useFadeUp() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-up").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useCity() {
  const [city, setCity] = useState("Ghana");
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        setCity(d.address?.city || d.address?.town || d.address?.village || "Ghana");
      } catch { setCity("Ghana"); }
    }, () => setCity("Ghana"));
  }, []);
  return city;
}

// ── Navbar ────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className="neo-nav" style={{ boxShadow: scrolled ? "0 6px 24px #d4cec6, 0 -2px 8px #ffffff" : "0 4px 16px #d4cec6, 0 -2px 8px #ffffff" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", height: 70, gap: "1rem" }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg,#ABC270,#8FA853)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "4px 4px 10px #d4cec6, -4px -4px 10px #ffffff",
            fontWeight: 800, color: "#fff", fontSize: "1.1rem",
          }}>B</div>
          <span style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#473C33" }}>BOAFO</span>
        </a>

        {/* Desktop links */}
        <div className="neo-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2rem", flex: 1, justifyContent: "center" }}>
          {[["/#services","Services"],["/#how-it-works","How It Works"],["/#testimonials","Reviews"]].map(([href,label]) => (
            <a key={label} href={href} className="nav-link">{label}</a>
          ))}
          {isAuthenticated && <Link href="/dashboard" className="nav-link">Dashboard</Link>}
        </div>

        {/* Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: "0.85rem", color: "#6B5B4E", fontWeight: 500 }}>{user?.name}</span>
              <button className="neo-btn" onClick={logout} style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, color: "#6B5B4E" }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href={getLoginUrl()} className="neo-btn" style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem", fontWeight: 600, color: "#6B5B4E", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Sign In</Link>
              <Link href="/login" className="neo-btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Get Started</Link>
            </>
          )}
          <button className="neo-btn" onClick={() => setMobileOpen(o => !o)} style={{ padding: "0.45rem", display: "none" }} aria-label="menu">
            {mobileOpen ? <X size={18} color="#473C33" /> : <Menu size={18} color="#473C33" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: NEO, borderTop: "1px solid #d4cec6", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[["/#services","Services"],["/#how-it-works","How It Works"],["/#testimonials","Reviews"]].map(([href,label]) => (
            <a key={label} href={href} className="nav-link" onClick={() => setMobileOpen(false)}>{label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

// ── Hero floating cards ───────────────────────────────────────────────────

function HeroScene() {
  return (
    <div className="neo-hero-scene" style={{ position: "relative", width: "100%", maxWidth: 480, height: 400 }}>
      {/* Card 1 — provider */}
      <div className="neo-hero-card neo-hero-card-1">
        <div style={{ width: "100%", height: 80, borderRadius: "0.875rem", background: "linear-gradient(135deg,#ABC270,#8FA853)", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 3px 3px 8px rgba(0,0,0,0.1)" }}>
          <HardHat size={36} color="#fff" />
        </div>
        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#473C33", margin: 0 }}>Samuel K. — Electrician</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Star size={13} fill="#FEC868" color="#FEC868" />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#473C33" }}>4.9</span>
          <span style={{ fontSize: "0.75rem", color: "#8A7A6E" }}>· 128 jobs</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <MapPin size={11} color="#8A7A6E" />
          <span style={{ fontSize: "0.75rem", color: "#8A7A6E" }}>Accra, Ghana</span>
        </div>
      </div>

      {/* Card 2 — job post */}
      <div className="neo-hero-card neo-hero-card-2">
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#FDA769", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>New Job</div>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#473C33", margin: "0 0 4px" }}>Fix kitchen plumbing leak</p>
        <p style={{ fontSize: "0.75rem", color: "#6B5B4E", margin: "0 0 10px" }}>Budget: GH₵ 250 – 400</p>
        <span style={{ background: "linear-gradient(135deg,#ABC270,#8FA853)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "3px 12px", borderRadius: 9999, boxShadow: "2px 2px 6px #d4cec6" }}>Open</span>
      </div>

      {/* Card 3 — payment */}
      <div className="neo-hero-card neo-hero-card-3">
        <div style={{ fontSize: "0.75rem", color: "#8A7A6E", marginBottom: 4 }}>Any Location</div>
        <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "#473C33" }}>GH₵ 380</div>
        <div style={{ fontSize: "0.75rem", color: "#8FA853", marginTop: 4, fontWeight: 600 }}>Boafo is Handy to serve you</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

function HomePageContent() {
  const { hideLoader } = useLoading();
  const navigate = useNavigation();
  const city = useCity();
  useFadeUp();

  useEffect(() => { hideLoader(); }, [hideLoader]);

  const categories = [
    { name: "Plumbing",    desc: "Pipes, fixtures & leak repairs",       icon: <Wrench size={26} />,      color: "#ABC270" },
    { name: "Electrical",  desc: "Wiring, panels & installations",       icon: <Bolt size={26} />,        color: "#FEC868" },
    { name: "Carpentry",   desc: "Custom woodwork & framing",            icon: <Hammer size={26} />,      color: "#FDA769" },
    { name: "HVAC",        desc: "Heating, cooling & ventilation",       icon: <Wind size={26} />,        color: "#ABC270" },
    { name: "Roofing",     desc: "Installation, repair & waterproofing", icon: <HomeIcon size={26} />,    color: "#FEC868" },
    { name: "Painting",    desc: "Interior, exterior & specialty coats", icon: <PaintBucket size={26} />, color: "#FDA769" },
    { name: "Masonry",     desc: "Brickwork, stone & concrete",          icon: <Layers size={26} />,      color: "#ABC270" },
    { name: "Landscaping", desc: "Garden design & lawn care",            icon: <Leaf size={26} />,        color: "#FEC868" },
  ];

  const steps = [
    { n: 1, title: "Post Your Job",  desc: "Describe what you need — our system matches you instantly.", icon: <Zap size={28} color="#ABC270" /> },
    { n: 2, title: "Choose a Pro",   desc: "Browse verified providers, read reviews and compare quotes.", icon: <Shield size={28} color="#FEC868" /> },
    { n: 3, title: "Rate Your Pro",  desc: "After the job is done, leave a rating to help other clients.", icon: <TrendingUp size={28} color="#FDA769" /> },
  ];

  const pros = [
    { name: "Samuel K.",  trade: "Electrician", rating: 4.9, jobs: 128, location: "Accra" },
    { name: "Akosua M.",  trade: "Plumber",     rating: 4.8, jobs: 94,  location: "Kumasi" },
    { name: "Yaw B.",     trade: "Carpenter",   rating: 4.9, jobs: 212, location: "Takoradi" },
  ];

  const testimonials = [
    { name: "Kwame A.",  role: "Homeowner",        text: "Found a brilliant electrician in under 10 minutes. The ratings gave me total peace of mind.", rating: 5 },
    { name: "Ama S.",    role: "Property Manager", text: "BOAFO made it so easy to find a reliable plumber. Transparent pricing, no surprises.", rating: 5 },
    { name: "Kofi B.",   role: "Homeowner",        text: "The verification system is excellent. I knew exactly who was coming to my home.", rating: 5 },
  ];

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: NEO }}>
      <GlobalLoader />
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="neo-hero" id="hero">
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "3rem", flexWrap: "wrap", paddingTop: "2rem", paddingBottom: "4rem" }}>
          {/* Text side */}
          <div style={{ flex: "1 1 360px", maxWidth: 560 }}>
            {/* Location badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.4rem 1rem", borderRadius: 9999, background: NEO, boxShadow: "4px 4px 10px #d4cec6, -4px -4px 10px #ffffff", marginBottom: "1.5rem", fontSize: "0.82rem", fontWeight: 600, color: "#8FA853" }}>
              <MapPin size={13} color="#8FA853" /> {city}
            </div>

            <h1 className="fade-up" style={{ fontSize: "clamp(2.2rem,5vw,3.6rem)", color: "#473C33", lineHeight: 1.15, marginBottom: "1.25rem", fontWeight: 800 }}>
              Find Skilled<br />
              <span style={{ color: "#ABC270" }}>Tradespeople</span><br />
              Near You
            </h1>

            <p className="fade-up" style={{ fontSize: "1.05rem", color: "#6B5B4E", lineHeight: 1.75, marginBottom: "2.25rem", maxWidth: 460 }}>
              BOAFO connects homeowners and property managers with verified, trusted trade professionals — quickly, safely, and transparently.
            </p>

            <div className="fade-up" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.75rem" }}>
              <Link href="/login" onClick={() => navigate("/login")}
                className="neo-btn-primary"
                style={{ padding: "0.8rem 2rem", fontSize: "1rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Post a Job
              </Link>
              <Link href="/search" onClick={() => navigate("/search")}
                className="neo-btn-gold"
                style={{ padding: "0.8rem 2rem", fontSize: "1rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Browse Pros
              </Link>
            </div>

            {/* Stats */}
            <div className="fade-up" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[["500+","Verified Pros"],["2 000+","Jobs Done"],["4.8★","Avg. Rating"]].map(([val, label]) => (
                <div key={label} className="neo-stat">
                  <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#473C33" }}>{val}</div>
                  <div style={{ fontSize: "0.78rem", color: "#8A7A6E", fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene */}
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────── */}
      <section id="services" className="neo-section">
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.6rem)", color: "#473C33", fontWeight: 800, marginBottom: "0.75rem" }}>Browse by Trade</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1rem" }}>Whatever the job, BOAFO has a verified professional for it.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1.5rem" }}>
            {categories.map((cat, i) => (
              <div key={cat.name} className="neo-cat-card fade-up" style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="neo-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
                  {cat.icon}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "0.4rem" }}>{cat.name}</h3>
                <p style={{ fontSize: "0.8rem", color: "#8A7A6E", lineHeight: 1.5, marginBottom: "1rem" }}>{cat.desc}</p>
                <Link href="/login" onClick={() => navigate("/login")}
                  style={{ fontSize: "0.8rem", fontWeight: 700, color: cat.color, textDecoration: "none", borderBottom: `2px solid ${cat.color}`, paddingBottom: 1 }}>
                  Find a Pro →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="neo-section" style={{ background: "#E8E2D9" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.6rem)", color: "#473C33", fontWeight: 800, marginBottom: "0.75rem" }}>How BOAFO Works</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1rem" }}>Three simple steps from problem to solved.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "2rem" }}>
            {steps.map((s, i) => (
              <div key={s.n} className="neo-step-card fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div className="neo-step-num">{s.n}</div>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: NEO, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff" }}>
                    {s.icon}
                  </div>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#473C33", marginBottom: "0.625rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6B5B4E", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP PROS ──────────────────────────────────────────────────── */}
      <section className="neo-section">
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.6rem)", color: "#473C33", fontWeight: 800, marginBottom: "0.75rem" }}>Top Rated Professionals</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1rem" }}>Hand-picked, verified and ready to help.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "2rem" }}>
            {pros.map((p, i) => (
              <div key={p.name} className="neo-pro-card fade-up" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="neo-avatar">
                  <User size={48} color="#8A7A6E" />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#473C33", marginBottom: 2 }}>{p.name}</h3>
                <p style={{ color: "#ABC270", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>{p.trade}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: "#6B5B4E" }}>
                    <MapPin size={12} color="#8A7A6E" /> {p.location}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem", fontWeight: 700, color: "#473C33" }}>
                    <Star size={14} fill="#FEC868" color="#FEC868" /> {p.rating}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#8A7A6E", marginBottom: "1.25rem" }}>{p.jobs} jobs completed</p>
                <Link href="/login" onClick={() => navigate("/login")}
                  className="neo-btn-primary"
                  style={{ width: "100%", padding: "0.7rem", fontSize: "0.875rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.875rem" }}>
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section id="testimonials" className="neo-section" style={{ background: "#E8E2D9" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.6rem)", color: "#473C33", fontWeight: 800, marginBottom: "0.75rem" }}>What People Say</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1rem" }}>Real stories from BOAFO users across Ghana.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "2rem" }}>
            {testimonials.map((t, i) => (
              <div key={t.name} className="neo-testimonial fade-up" style={{ transitionDelay: `${i * 90}ms` }}>
                <p style={{ color: "#473C33", lineHeight: 1.75, fontSize: "0.95rem", marginBottom: "1.5rem", marginTop: "0.5rem" }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: NEO, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 10px #d4cec6, -4px -4px 10px #ffffff", flexShrink: 0 }}>
                    <User size={22} color="#8A7A6E" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#473C33", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "#8A7A6E", margin: "2px 0 4px" }}>{t.role}</p>
                    <span style={{ color: "#FEC868", letterSpacing: 1, fontSize: "0.9rem" }}>{"★".repeat(t.rating)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="neo-cta">
        <div className="container fade-up" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", background: NEO, borderRadius: "2rem", padding: "4rem 2.5rem", boxShadow: "12px 12px 32px #d4cec6, -12px -12px 32px #ffffff" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "#473C33", fontWeight: 800, marginBottom: "1rem" }}>Ready to get started?</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1.05rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
              Join thousands of Ghanaians who trust BOAFO every day.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/login" onClick={() => navigate("/login")}
                className="neo-btn-primary"
                style={{ padding: "0.875rem 2.25rem", fontSize: "1rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                I Need a Service
              </Link>
              <Link href="/login" onClick={() => navigate("/login")}
                className="neo-btn-gold"
                style={{ padding: "0.875rem 2.25rem", fontSize: "1rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                I'm a Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="neo-footer">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "2.5rem", marginBottom: "3rem" }}>
            <div>
              <div style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#FFF8EE", marginBottom: "0.75rem" }}>BOAFO</div>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,248,238,0.6)", lineHeight: 1.7 }}>Connecting Ghanaians with skilled tradespeople since 2026.</p>
            </div>
            {[
              { heading: "Customers", links: ["Post a Job","Browse Providers","How It Works","Pricing"] },
              { heading: "Providers",  links: ["Sign Up","Get Verified","Earnings","Tools"] },
              { heading: "Company",    links: ["About BOAFO","Privacy Policy","Terms of Service","Contact"] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontWeight: 700, color: "#FEC868", marginBottom: "1rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.heading}</div>
                {col.links.map(l => (
                  <div key={l} style={{ marginBottom: "0.5rem" }}>
                    <Link href="/login" onClick={() => navigate("/login")} className="footer-link">{l}</Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,248,238,0.1)", paddingTop: "2rem", textAlign: "center", fontSize: "0.8rem", color: "rgba(255,248,238,0.4)" }}>
            © {new Date().getFullYear()} BOAFO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <LoadingProvider>
      <HomePageContent />
    </LoadingProvider>
  );
}

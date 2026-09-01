import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import { GlobalLoader } from "@/components/GlobalLoader";
import { useNavigation } from "@/hooks/useNavigation";

// ── Data ──────────────────────────────────────────────────────────────────

// ── Navbar ────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`boafo-nav${scrolled ? " scrolled" : ""}`}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", height: "72px" }}>
        {/* Logo - Using Link for navigation */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <span style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg,#ABC270,#8FA853)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Moonwalk','Inter',sans-serif",
            color: "#fff", fontWeight: 700, fontSize: "1.1rem",
            boxShadow: "0 4px 14px rgba(171,194,112,0.4)",
            flexShrink: 0,
          }}>B</span>
          <span style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#473C33", letterSpacing: "0.03em" }}>BOAFO</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="desktop-nav">
          <a href="/#services" className="nav-link">Services</a>
          <a href="/#how-it-works" className="nav-link">How It Works</a>
          <a href="/#testimonials" className="nav-link">Reviews</a>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className="nav-link" onClick={() => navigate('/dashboard')}>Dashboard</Link>
              <Link href="/profile" className="nav-link" onClick={() => navigate('/profile')}>Profile</Link>
            </>
          )}
        </div>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: "0.875rem", color: "#6B5B4E", fontWeight: 500 }}>
                {user?.name ?? "Welcome"}
              </span>
              <button className="btn-boafo btn-outline" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }} onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href={getLoginUrl()} onClick={() => navigate(getLoginUrl())} className="btn-boafo btn-outline" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
                Sign In
              </Link>
              <Link href="/login" onClick={() => navigate('/login')} className="btn-boafo btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── 3-D Hero Scene ────────────────────────────────────────────────────────

function HeroScene() {
  return (
    <div className="scene-3d" aria-hidden>
      {/* Card 1 — provider profile */}
      <div className="card-3d card-3d-1">
        <img src="/images/provider-photo.jpg" alt="A professional tradesperson" style={{ height: 90, width: '100%', objectFit: 'cover', borderRadius: '12px', marginBottom: "0.75rem" }} />
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#473C33" }}>Samuel K. — Electrician</div>
        <div style={{ fontSize: "0.8rem", color: "#8FA853", marginTop: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FEC868" stroke="#FEC868" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          4.9
          <span style={{ color: '#6B5B4E', marginLeft: '4px' }}>·  128 jobs</span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#6B5B4E", marginTop: 4 }}>Accra, Ghana</div>
      </div>

      {/* Card 2 — job post */}
      <div className="card-3d card-3d-2">
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#FDA769", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>New Job</div>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#473C33" }}>Fix kitchen plumbing leak</div>
        <div style={{ fontSize: "0.75rem", color: "#6B5B4E", marginTop: 4 }}>Budget: GH₵ 250 – 400</div>
        <div style={{ marginTop: 10 }}>
          <span style={{ background: "#ABC270", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: 9999 }}>Open</span>
        </div>
      </div>

      {/* Card 3 — payment */}
      <div className="card-3d card-3d-3">
        <div style={{ fontSize: "0.75rem", color: "#6B5B4E", marginBottom: 4 }}>Any Location</div>
        <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#473C33" }}>GH₵ 380</div>
        <div style={{ fontSize: "0.75rem", color: "#8FA853", marginTop: 4, fontWeight: 600 }}>Boafo is Handy to serve you</div>
      </div>
    </div>
  );
}

// ── Fade-up hook ──────────────────────────────────────────────────────────

function useFadeUp() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Location badge ────────────────────────────────────────────────────────

function LocationBadge() {
  const [loc, setLoc] = useState<string>("Detecting location…");

  useEffect(() => {
    if (!navigator.geolocation) { setLoc("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Your area";
          setLoc(city);
        } catch {
          setLoc("Your area");
        }
      },
      () => setLoc("Ghana"),
    );
  }, []);

  return (
    <span className="location-badge">
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      {loc}
    </span>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#FEC868", letterSpacing: 1 }}>{"★".repeat(n)}</span>;
}

// ── Main Page ─────────────────────────────────────────────────────────────

function HomePageContent() {
  // Example data - replace with API calls
  const tradeCategories = [
    { name: "Plumbing",    description: "Pipes, fixtures & leak repairs",        color: "#ABC270" },
    { name: "Electrical",  description: "Wiring, panels & smart installations",  color: "#FEC868" },
    // ... other categories
  ];
  const howItWorks = [
    { step: 1, title: "Post Your Job",       desc: "Describe what you need — our system matches you instantly." },
    { step: 2, title: "Choose a Pro",        desc: "Browse verified providers, read reviews and compare quotes." },
    { step: 3, title: "Rate Your Pro",   desc: "After the job is done, leave a rating and review to help other clients." },
  ];
  const testimonials = [ { name: "Kwame A.", role: "Homeowner", text: "Found a brilliant electrician in under 10 minutes. The Ratings gave me total peace of mind.", rating: 5 }, /* ... */ ];

  const { hideLoader } = useLoading();
  const navigate = useNavigation();
  useFadeUp();

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "#FFF8EE" }}>
      <GlobalLoader />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
      </div>


      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero-section" id="hero">
        <div className="hero-blob blob-sage" />
        <div className="hero-blob blob-gold" />
        <div className="hero-blob blob-amber" />

        <div className="container" style={{ display: "flex", alignItems: "center", gap: "3rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {/* Text */}
          <div style={{ flex: "1 1 380px", maxWidth: 560 }}>
            <div style={{ marginBottom: "1rem" }}>
              <LocationBadge />
            </div>
            <h1 style={{ fontSize: "clamp(2.4rem,5vw,3.75rem)", color: "#473C33", marginBottom: "1.25rem", lineHeight: 1.15 }}>
              Find Skilled<br />
              <span style={{ color: "#ABC270" }}>Tradespeople</span><br />
              Near You
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#6B5B4E", marginBottom: "2rem", lineHeight: 1.7, maxWidth: 460 }}>
              BOAFO connects homeowners and property managers with verified, trusted trade professionals — quickly, safely, and transparently.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
              <Link href="/login" onClick={() => navigate('/login')} className="btn-boafo btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
                Post a Job
              </Link>
              <Link href="/search" onClick={() => navigate('/search')} className="btn-boafo btn-secondary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
                Browse Pros
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                ["500+", "Verified Pros"],
                ["2 000+", "Jobs Done"],
                ["4.8", "Avg. Rating"]
              ].map(([val, label]) => (
                <div key={label} className="stat-pill">
                  <div style={{ fontWeight: 800, fontSize: "1.375rem", color: "#473C33" }}>{val}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6B5B4E", fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-D Scene */}
          <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }}>
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section id="services" className="section-white" style={{ padding: "5rem 0" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", marginBottom: "0.75rem" }}>Browse by Trade</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1.05rem" }}>Whatever the job, BOAFO has a verified professional for it.</p>
          </div>

          <div className="grid-4">
            {tradeCategories.map((cat, i) => (
              <div key={cat.name} className="category-card fade-up" style={{ transitionDelay: `${i * 60}ms` }}>
                {/* Image placeholder */}
                <div className="img-placeholder img-placeholder-sm" style={{ marginBottom: "1rem", borderRadius: "0.75rem" }}>
                  <span>{cat.name} Image</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "0.4rem" }}>{cat.name}</h3>
                <p style={{ fontSize: "0.825rem", color: "#6B5B4E" }}>{cat.description}</p>
                <div style={{ marginTop: "1rem" }}>
                  <Link href="/login" onClick={() => navigate('/login')} style={{
                    display: "inline-block", fontSize: "0.8125rem", fontWeight: 600,
                    color: cat.color, textDecoration: "none",
                    borderBottom: `2px solid ${cat.color}`,
                    paddingBottom: "1px", transition: "opacity 0.2s",
                  }}>
                    Find a Pro →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-warm" style={{ padding: "5rem 0" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", marginBottom: "0.75rem" }}>How BOAFO Works</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1.05rem" }}>Three simple steps from problem to solved.</p>
          </div>

          <div className="grid-3">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="boafo-card fade-up" style={{ padding: "2rem", transitionDelay: `${i * 100}ms` }}>
                {/* Image placeholder */}
                <div className="img-placeholder img-placeholder-md" style={{ marginBottom: "1.5rem" }}>
                  <span>Step {item.step} Illustration</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div className="step-number">{item.step}</div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.9rem", color: "#6B5B4E", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROVIDERS ───────────────────────────────────────── */}
      <section style={{ padding: "5rem 0", background: "#fff" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", marginBottom: "0.75rem" }}>Top Rated Professionals</h2>
            <p style={{ color: "#6B5B4E", fontSize: "1.05rem" }}>Hand-picked, verified and ready to help.</p>
          </div>

          <div className="grid-3">
            {[
              { name: "Samuel K.",  trade: "Electrician",  rating: 4.9, jobs: 128, location: "Accra" },
              { name: "Akosua M.", trade: "Plumber",       rating: 4.8, jobs: 94,  location: "Kumasi" },
              { name: "Yaw B.",    trade: "Carpenter",     rating: 4.9, jobs: 212, location: "Takoradi" },
            ].map((pro, i) => (
              <div key={pro.name} className="boafo-card fade-up" style={{ padding: "1.75rem", transitionDelay: `${i * 80}ms` }}>
                {/* Avatar placeholder */}
                <div className="img-placeholder" style={{ height: 180, borderRadius: "1rem", marginBottom: "1.25rem" }}>
                  <span>{pro.name} Photo</span>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#473C33" }}>{pro.name}</h3>
                <p style={{ color: "#ABC270", fontSize: "0.875rem", fontWeight: 600, marginTop: 2 }}>{pro.trade}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>{pro.location}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#473C33", display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FEC868" stroke="#FEC868" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg> {pro.rating}
                  </span>
                </div>
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6B5B4E" }}>{pro.jobs} jobs completed</div>
                <Link href="/login" onClick={() => navigate('/login')} className="btn-boafo btn-primary" style={{ width: "100%", marginTop: "1.25rem", fontSize: "0.875rem", justifyContent: "center" }}>
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section id="testimonials" className="section-warm" style={{ padding: "5rem 0" }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", marginBottom: "0.75rem" }}>What People Say</h2>
            <p style={{ color: "#6B5B4E" }}>Real stories from BOAFO users across Ghana.</p>
          </div>

          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div key={t.name} className="testimonial-card fade-up" style={{ transitionDelay: `${i * 90}ms` }}>
                <p style={{ color: "#473C33", lineHeight: 1.7, fontSize: "0.95rem", marginTop: "1rem", marginBottom: "1.5rem" }}>{t.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  {/* Avatar placeholder */}
                  <div className="img-placeholder" style={{ width: 48, height: 48, minWidth: 48, borderRadius: "50%", fontSize: "0.7rem" }}>
                    <span style={{ textAlign: "center", padding: "0 4px" }}>{t.name.split(" ")[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#473C33" }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>{t.role}</div>
                    <Stars n={t.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg,#ABC270,#8FA853)", padding: "5rem 0" }}>
        <div className="container fade-up" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", color: "#fff", marginBottom: "1rem" }}>Ready to get started?</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
            Join thousands of Ghanaians who trust BOAFO every day.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" onClick={() => navigate('/login')} className="btn-boafo" style={{ background: "#fff", color: "#473C33", border: "none", fontWeight: 700, fontSize: "1rem", padding: "0.875rem 2.25rem" }}>
              I Need a Service
            </Link>
            <Link href="/login" onClick={() => navigate('/login')} className="btn-boafo" style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "1rem", padding: "0.875rem 2.25rem" }}>
              I'm a Professional
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="boafo-footer">
        <div className="container">
          <div className="grid-4" style={{ marginBottom: "3rem" }}>
            <div>
              <div style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#FFF8EE", marginBottom: "0.75rem" }}>BOAFO</div>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,248,238,0.6)", lineHeight: 1.7 }}>
                Connecting Ghanaians with skilled tradespeople since 2026.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#FEC868", marginBottom: "1rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Customers</div>
              {["Post a Job", "Browse Providers", "How It Works", "Pricing"].map(l => (
                <div key={l} style={{ marginBottom: "0.5rem" }}><Link href="/login" onClick={() => navigate('/login')} className="footer-link">{l}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#FEC868", marginBottom: "1rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Providers</div>
              {["Sign Up", "Get Verified", "Earnings", "Tools"].map(l => (
                <div key={l} style={{ marginBottom: "0.5rem" }}><Link href="/login" onClick={() => navigate('/login')} className="footer-link">{l}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#FEC868", marginBottom: "1rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company</div>
              {["About BOAFO", "Privacy Policy", "Terms of Service", "Contact"].map(l => {
                const path = `/${l.toLowerCase().replace(/\s+/g, '-')}`;
                return <div key={l} style={{ marginBottom: "0.5rem" }}><Link href={path} onClick={() => navigate(path)} className="footer-link">{l}</Link></div>
              })}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,248,238,0.12)", paddingTop: "2rem", textAlign: "center", fontSize: "0.8rem", color: "rgba(255,248,238,0.45)" }}>
            &copy; {new Date().getFullYear()} BOAFO. All rights reserved.
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

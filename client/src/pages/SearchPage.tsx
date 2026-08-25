import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { providersApi, categoriesApi, jobsApi } from "@/lib/api";

type Tab = "providers" | "jobs";

function Stars({ n, small }: { n: number; small?: boolean }) {
  return <span style={{ color: "#FEC868", fontSize: small ? "0.75rem" : "0.875rem" }}>{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
}

function VerifiedBadge({ status }: { status: string }) {
  const verified = ["id_verified", "certified", "community_vouched"].includes(status);
  if (!verified) return null;
  return (
    <span style={{ background: "rgba(171,194,112,0.15)", border: "1px solid rgba(171,194,112,0.4)", color: "#8FA853", borderRadius: 9999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      ✓ Verified
    </span>
  );
}

function ProviderCard({ p, onClick }: { p: any; onClick: () => void }) {
  return (
    <div className="boafo-card" style={{ padding: "1.5rem", cursor: "pointer" }} onClick={onClick}>
      <div className="img-placeholder img-placeholder-sm" style={{ marginBottom: "1rem", borderRadius: "0.875rem" }}>
        <span>{p.userName || "Provider"} Photo</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{p.userName || "Provider"}</h3>
        <VerifiedBadge status={p.verificationStatus} />
      </div>
      {p.bio && <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.75rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.bio}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Stars n={parseFloat(p.averageRating) || 0} />
          <span style={{ fontSize: "0.75rem", color: "#6B5B4E", marginLeft: 4 }}>({p.totalReviews || 0})</span>
        </div>
        {p.hourlyRate && <span style={{ fontWeight: 700, color: "#473C33", fontSize: "0.875rem" }}>GH₵ {p.hourlyRate}/hr</span>}
      </div>
      {p.yearsOfExperience && <p style={{ fontSize: "0.75rem", color: "#6B5B4E", marginTop: "0.375rem" }}>{p.yearsOfExperience} yrs experience</p>}
    </div>
  );
}

function JobCard({ j, onClick }: { j: any; onClick: () => void }) {
  const age = Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000);
  return (
    <div className="boafo-card" style={{ padding: "1.5rem", cursor: "pointer" }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", flex: 1 }}>{j.title}</h3>
        <span style={{ background: "rgba(171,194,112,0.15)", color: "#8FA853", borderRadius: 9999, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>Open</span>
      </div>
      <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.6, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{j.description}</p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {j.budget && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#473C33" }}>GH₵ {j.budget}</span>}
        {j.location && <span style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>📍 {j.location}</span>}
        <span style={{ fontSize: "0.8rem", color: "#6B5B4E", marginLeft: "auto" }}>{age === 0 ? "Today" : `${age}d ago`}</span>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("providers");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [search, setSearch] = useState({ q: "", location: "", categoryId: "", minRating: "", verified: false });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const { data: providers = [], isLoading: loadingP } = useQuery({
    queryKey: ["providers-search", search],
    queryFn: () => providersApi.search({
      q: search.q || undefined,
      location: search.location || undefined,
      tradeCategoryId: search.categoryId ? Number(search.categoryId) : undefined,
      minRating: search.minRating ? Number(search.minRating) : undefined,
      verified: search.verified || undefined,
    }),
    enabled: tab === "providers",
  });

  const { data: jobs = [], isLoading: loadingJ } = useQuery({
    queryKey: ["jobs-search", search],
    queryFn: () => jobsApi.search({
      q: search.q || undefined,
      location: search.location || undefined,
      tradeCategoryId: search.categoryId ? Number(search.categoryId) : undefined,
    }),
    enabled: tab === "jobs",
  });

  // Detect location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        const city = d.address?.city || d.address?.town || d.address?.village || "";
        if (city) setLocation(city);
      } catch { /* ignore */ }
    });
  }, []);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setSearch({ q, location, categoryId: String(categoryId), minRating: String(minRating), verified: verifiedOnly });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "rgba(255,248,238,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "1rem", height: 64 }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none", flexShrink: 0 }}>BOAFO</a>
          <div style={{ flex: 1, maxWidth: 480 }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
              <input className="boafo-input" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, padding: "0.5rem 0.875rem", fontSize: "0.875rem" }} />
              <button type="submit" className="btn-boafo btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>Search</button>
            </form>
          </div>
          <a href="/dashboard/customer" className="nav-link" style={{ fontSize: "0.875rem" }}>Dashboard</a>
          <a href="/login" className="btn-boafo btn-primary" style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}>Post Job</a>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>

          {/* ── Sidebar filters ── */}
          <aside style={{ width: 240, flexShrink: 0 }}>
            {/* Tab toggle */}
            <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem" }}>
              {(["providers", "jobs"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: "0.5rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.8rem", transition: "all 0.2s",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#473C33" : "#6B5B4E",
                }}>
                  {t === "providers" ? "Providers" : "Jobs"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="boafo-label">Location</label>
                <input className="boafo-input" placeholder="City or area" value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div>
                <label className="boafo-label">Trade Category</label>
                <select className="boafo-input" value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">All Categories</option>
                  {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {tab === "providers" && (
                <>
                  <div>
                    <label className="boafo-label">Min Rating</label>
                    <select className="boafo-input" value={minRating} onChange={e => setMinRating(e.target.value ? Number(e.target.value) : "")}>
                      <option value="">Any</option>
                      <option value="3">3+ stars</option>
                      <option value="4">4+ stars</option>
                      <option value="4.5">4.5+ stars</option>
                    </select>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#ABC270" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#473C33" }}>Verified only</span>
                  </label>
                </>
              )}

              <button className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => handleSearch()}>Apply Filters</button>
              <button className="btn-boafo btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem" }}
                onClick={() => { setQ(""); setLocation(""); setCategoryId(""); setMinRating(""); setVerifiedOnly(false); setSearch({ q: "", location: "", categoryId: "", minRating: "", verified: false }); }}>
                Clear
              </button>
            </div>
          </aside>

          {/* ── Results ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#473C33" }}>
                {tab === "providers" ? `${(providers as any[]).length} Providers Found` : `${(jobs as any[]).length} Jobs Found`}
              </h2>
            </div>

            {(tab === "providers" ? loadingP : loadingJ) ? (
              <div className="grid-3">{[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: "1.25rem", height: 280, animation: "pulse 1.5s ease-in-out infinite", border: "1.5px solid #E8D9BF" }} />
              ))}</div>
            ) : tab === "providers" ? (
              (providers as any[]).length === 0 ? <EmptyState msg="No providers found. Try adjusting your filters." /> :
              <div className="grid-3">
                {(providers as any[]).map((p: any) => <ProviderCard key={p.id} p={p} onClick={() => navigate(`/provider/${p.id}`)} />)}
              </div>
            ) : (
              (jobs as any[]).length === 0 ? <EmptyState msg="No open jobs found." /> :
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(jobs as any[]).map((j: any) => <JobCard key={j.id} j={j} onClick={() => navigate(`/job/${j.id}`)} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F5EDD8", border: "2px dashed #E8D9BF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "2rem" }}>🔍</div>
      <p style={{ color: "#6B5B4E", fontSize: "1rem" }}>{msg}</p>
    </div>
  );
}

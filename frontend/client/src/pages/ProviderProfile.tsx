import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi, bookingsApi, directChatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Phone } from "lucide-react";

function Stars({ n }: { n: number }) {
  const r = Math.round(n);
  return <span style={{ color: "#FEC868" }}>{"★".repeat(r)}{"☆".repeat(5 - r)}</span>;
}

function VerifiedBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    id_verified: ["✓ ID Verified", "#ABC270"],
    certified: ["✓ Certified", "#FEC868"],
    community_vouched: ["✓ Community Vouched", "#FDA769"],
  };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span style={{ background: `${entry[1]}20`, border: `1px solid ${entry[1]}60`, color: entry[1], borderRadius: 9999, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 700 }}>
      {entry[0]}
    </span>
  );
}

export default function ProviderProfile() {
  const { providerId } = useParams<{ providerId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const id = Number(providerId);

  const [bookingForm, setBookingForm] = useState({ notes: "", date: "", time: "" });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", title: "" });
  const [showBooking, setShowBooking] = useState(false);
  const [tab, setTab] = useState<"about" | "portfolio" | "reviews">("about");
  const [msg, setMsg] = useState("");

  const { data: provider, isLoading } = useQuery({ queryKey: ["provider", id], queryFn: () => providersApi.getById(id), enabled: !!id });
  const { data: reviews = [] } = useQuery({ queryKey: ["provider-reviews", id], queryFn: () => providersApi.getReviews(id) });
  const { data: portfolio = [] } = useQuery({ queryKey: ["provider-portfolio", id], queryFn: () => providersApi.getPortfolio(id) });
  const { data: specializations = [] } = useQuery({ queryKey: ["provider-spec", id], queryFn: () => providersApi.getSpecializations(id) });

  const bookMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: () => { setShowBooking(false); setMsg("Booking request sent!"); },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#6B5B4E" }}>Loading profile…</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}><p style={{ color: "#6B5B4E", marginBottom: "1rem" }}>Provider not found</p>
          <a href="/search" className="btn-boafo btn-primary">Browse Providers</a></div>
      </div>
    );
  }

  const rating = parseFloat(provider.averageRating) || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "rgba(255,248,238,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <a href="/search" className="nav-link" style={{ fontSize: "0.875rem" }}>← Search</a>
        </div>
      </nav>

      <div className="container" style={{ padding: "2.5rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── Left: Profile ── */}
          <div style={{ flex: "1 1 560px" }}>
            {/* Header card */}
            <div className="boafo-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <div className="img-placeholder" style={{ width: 110, height: 110, minWidth: 110, borderRadius: "50%" }}>
                  <span style={{ fontSize: "0.7rem" }}>Photo</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#473C33" }}>{provider.userName || "Provider"}</h1>
                    <VerifiedBadge status={provider.verificationStatus} />
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Stars n={rating} />
                      <span style={{ fontWeight: 700, color: "#473C33", fontSize: "0.9rem" }}>{rating.toFixed(1)}</span>
                      <span style={{ color: "#6B5B4E", fontSize: "0.8rem" }}>({provider.totalReviews || 0} reviews)</span>
                    </div>
                    {provider.yearsOfExperience && (
                      <span style={{ color: "#6B5B4E", fontSize: "0.875rem" }}>{provider.yearsOfExperience} yrs experience</span>
                    )}
                  </div>
                  {provider.hourlyRate && (
                    <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "#473C33" }}>GH₵ {provider.hourlyRate}<span style={{ fontWeight: 400, fontSize: "0.8rem", color: "#6B5B4E" }}>/hr</span></div>
                  )}
                  {provider.userPhone && (
                    <a href={`tel:${provider.userPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.75rem", color: "#ABC270", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
                      📞 {provider.userPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem" }}>
              {(["about", "portfolio", "reviews"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: "0.55rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s", textTransform: "capitalize",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#473C33" : "#6B5B4E",
                  boxShadow: tab === t ? "0 2px 8px rgba(71,60,51,0.1)" : "none",
                }}>{t}</button>
              ))}
            </div>

            {tab === "about" && (
              <div className="boafo-card" style={{ padding: "1.75rem" }}>
                {provider.bio && <p style={{ color: "#473C33", lineHeight: 1.7, marginBottom: "1.25rem" }}>{provider.bio}</p>}
                {(specializations as any[]).length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#473C33", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Specializations</h3>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {(specializations as any[]).map((s: any) => (
                        <span key={s.id} style={{ background: "rgba(171,194,112,0.12)", border: "1px solid rgba(171,194,112,0.3)", borderRadius: 9999, padding: "3px 12px", fontSize: "0.8rem", color: "#8FA853", fontWeight: 600 }}>
                          {s.tradeCategoryId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {provider.serviceAreaRadius && <p style={{ color: "#6B5B4E", fontSize: "0.875rem" }}>📍 Services within {provider.serviceAreaRadius} km radius</p>}
              </div>
            )}

            {tab === "portfolio" && (
              <div>
                {(portfolio as any[]).length === 0 ? (
                  <div className="boafo-card" style={{ padding: "3rem", textAlign: "center" }}>
                    <p style={{ color: "#6B5B4E" }}>No portfolio items yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem" }}>
                    {(portfolio as any[]).map((item: any) => (
                      <div key={item.id} className="boafo-card" style={{ padding: "0.75rem" }}>
                        <div className="img-placeholder img-placeholder-sm" style={{ marginBottom: "0.625rem" }}>
                          <span style={{ fontSize: "0.7rem" }}>Work Photo</span>
                        </div>
                        {item.title && <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#473C33" }}>{item.title}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(reviews as any[]).length === 0 ? (
                  <div className="boafo-card" style={{ padding: "3rem", textAlign: "center" }}><p style={{ color: "#6B5B4E" }}>No reviews yet.</p></div>
                ) : (reviews as any[]).map((r: any) => (
                  <div key={r.id} className="testimonial-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#473C33" }}>{r.customerName || "Customer"}</span>
                        <div><Stars n={r.rating} /></div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#6B5B4E" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.title && <p style={{ fontWeight: 600, color: "#473C33", marginBottom: "0.375rem" }}>{r.title}</p>}
                    {r.comment && <p style={{ color: "#6B5B4E", lineHeight: 1.6, fontSize: "0.875rem" }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Booking sidebar ── */}
          <div style={{ width: 300, flexShrink: 0, position: "sticky", top: 80 }}>
            {msg && <div style={{ background: "rgba(171,194,112,0.15)", border: "1px solid rgba(171,194,112,0.4)", borderRadius: "0.75rem", padding: "0.875rem 1rem", color: "#8FA853", fontWeight: 600, marginBottom: "1rem", fontSize: "0.875rem" }}>{msg}</div>}

            <div className="boafo-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", marginBottom: "1.25rem" }}>Book This Pro</h2>

              {isAuthenticated ? (
                !showBooking ? (
                  <button className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: "0.75rem" }} onClick={() => setShowBooking(true)}>
                    Request Booking
                  </button>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate({ providerId: id, notes: bookingForm.notes }); }} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <div>
                      <label className="boafo-label">Preferred Date</label>
                      <input className="boafo-input" type="date" value={bookingForm.date} onChange={e => setBookingForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="boafo-label">Notes</label>
                      <textarea className="boafo-input" rows={3} placeholder="Describe what you need…" value={bookingForm.notes} onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "none" }} />
                    </div>
                    <button type="submit" className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={bookMutation.isPending}>
                      {bookMutation.isPending ? "Sending…" : "Send Request"}
                    </button>
                    <button type="button" className="btn-boafo btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "0.825rem" }} onClick={() => setShowBooking(false)}>Cancel</button>
                  </form>
                )
              ) : (
                <a href="/login" className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center" }}>Sign In to Book</a>
              )}

              {isAuthenticated && user?.role === "customer" && (
                <button
                  className="btn-boafo btn-secondary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => {
                    directChatApi.startChat(id).then(res => navigate(`/chat/direct/${res.chatId}`));
                  }}
                >
                  <MessageCircle size={15} /> Chat with Provider
                </button>
              )}
              {provider.userPhone && (
                <a href={`tel:${provider.userPhone}`} className="btn-boafo btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone size={15} /> Call Directly
                </a>
              )}
            </div>

            {/* Trust signals */}
            <div className="boafo-card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#473C33", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>Trust & Safety</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  ["✓", "Identity Verified by BOAFO", provider.verificationStatus !== "unverified"],
                  ["✓", "Secure escrow payments"],
                  ["✓", "Dispute resolution available"],
                ].map(([icon, text, cond], i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ color: cond !== false ? "#ABC270" : "#E8D9BF", fontWeight: 700, fontSize: "0.875rem" }}>{icon}</span>
                    <span style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>{text as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

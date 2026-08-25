import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, jobsApi, providersApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pending", "#FEC868"], accepted: ["Accepted", "#ABC270"],
    declined: ["Declined", "#E05A3A"], completed: ["Completed", "#8FA853"],
    in_progress: ["In Progress", "#FDA769"], open: ["Open", "#ABC270"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return <span style={{ background: `${color}20`, border: `1px solid ${color}50`, color, borderRadius: 9999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{label}</span>;
}

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#FEC868" }}>{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
}

export default function ProviderDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [tab, setTab] = useState("bookings");
  const [bidModal, setBidModal] = useState<{ jobId: number; title: string } | null>(null);
  const [bidForm, setBidForm] = useState({ amount: "", message: "", estimatedDays: "" });
  const [profileForm, setProfileForm] = useState({ bio: "", hourlyRate: "", yearsOfExperience: "" });
  const [showProfile, setShowProfile] = useState(false);
  const qc = useQueryClient();

  const { data: bookings = [] } = useQuery({ queryKey: ["my-bookings-provider"], queryFn: bookingsApi.getByProvider, enabled: tab === "bookings" });
  const { data: openJobs = [] } = useQuery({ queryKey: ["open-jobs"], queryFn: () => jobsApi.list(30, 0), enabled: tab === "jobs" });
  const { data: profile } = useQuery({ queryKey: ["my-provider-profile"], queryFn: providersApi.getProfile });
  const { data: earnings } = useQuery({ queryKey: ["earnings"], queryFn: providersApi.getTotalEarnings, enabled: tab === "earnings" });

  const acceptMutation = useMutation({ mutationFn: bookingsApi.accept, onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bookings-provider"] }) });
  const declineMutation = useMutation({ mutationFn: (id: number) => bookingsApi.decline(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bookings-provider"] }) });

  const bidMutation = useMutation({
    mutationFn: ({ jobId, data }: any) => jobsApi.placeBid(jobId, data),
    onSuccess: () => { setBidModal(null); setBidForm({ amount: "", message: "", estimatedDays: "" }); },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => providersApi.updateProfile(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-provider-profile"] }); setShowProfile(false); },
  });

  const pending = (bookings as any[]).filter((b: any) => b.status === "pending").length;
  const active = (bookings as any[]).filter((b: any) => b.status === "accepted" || b.status === "in_progress").length;

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <div style={{ flex: 1 }} />
          <a href="/search" className="nav-link" style={{ fontSize: "0.875rem" }}>Browse Jobs</a>
          <span style={{ fontSize: "0.875rem", color: "#6B5B4E" }}>{user?.name}</span>
          <button className="btn-boafo btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#473C33", marginBottom: "0.25rem" }}>Provider Dashboard</h1>
            <p style={{ color: "#6B5B4E", fontSize: "0.9rem" }}>Manage your bookings and bids</p>
          </div>
          <button className="btn-boafo btn-secondary" onClick={() => setShowProfile(true)}>Edit Profile</button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {[
            ["Pending Requests", pending, "#FDA769"],
            ["Active Jobs", active, "#ABC270"],
            ["Completed", (bookings as any[]).filter((b: any) => b.status === "completed").length, "#8FA853"],
            ["Rating", profile ? `${parseFloat(profile.averageRating || "0").toFixed(1)} ★` : "–", "#FEC868"],
          ].map(([label, val, color]) => (
            <div key={label as string} className="boafo-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>{label as string}</p>
              <p style={{ fontSize: val && String(val).includes("★") ? "1.375rem" : "2rem", fontWeight: 800, color: color as string }}>{val as any}</p>
            </div>
          ))}
        </div>

        {/* Edit Profile Modal */}
        {showProfile && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 460 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Update Profile</h2>
              <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate({ bio: profileForm.bio || undefined, hourlyRate: profileForm.hourlyRate || undefined, yearsOfExperience: profileForm.yearsOfExperience ? Number(profileForm.yearsOfExperience) : undefined }); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div><label className="boafo-label">Bio</label><textarea className="boafo-input" rows={3} placeholder="Describe your skills and experience…" value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} style={{ resize: "none" }} /></div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}><label className="boafo-label">Hourly Rate (GH₵)</label><input className="boafo-input" type="number" placeholder="e.g. 80" value={profileForm.hourlyRate} onChange={e => setProfileForm(f => ({ ...f, hourlyRate: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label className="boafo-label">Years Experience</label><input className="boafo-input" type="number" placeholder="e.g. 5" value={profileForm.yearsOfExperience} onChange={e => setProfileForm(f => ({ ...f, yearsOfExperience: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }}>Save</button>
                  <button type="button" className="btn-boafo btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowProfile(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bid Modal */}
        {bidModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 440 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#473C33", marginBottom: "0.5rem" }}>Place a Bid</h2>
              <p style={{ color: "#6B5B4E", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{bidModal.title}</p>
              <form onSubmit={(e) => { e.preventDefault(); bidMutation.mutate({ jobId: bidModal.jobId, data: { jobId: bidModal.jobId, amount: bidForm.amount, message: bidForm.message, estimatedDays: bidForm.estimatedDays ? Number(bidForm.estimatedDays) : undefined } }); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}><label className="boafo-label">Your Price (GH₵)</label><input className="boafo-input" type="number" required placeholder="e.g. 250" value={bidForm.amount} onChange={e => setBidForm(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label className="boafo-label">Est. Days</label><input className="boafo-input" type="number" placeholder="e.g. 2" value={bidForm.estimatedDays} onChange={e => setBidForm(f => ({ ...f, estimatedDays: e.target.value }))} /></div>
                </div>
                <div><label className="boafo-label">Message to Customer</label><textarea className="boafo-input" rows={3} placeholder="Why should they choose you?" value={bidForm.message} onChange={e => setBidForm(f => ({ ...f, message: e.target.value }))} style={{ resize: "none" }} /></div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={bidMutation.isPending}>{bidMutation.isPending ? "Submitting…" : "Submit Bid"}</button>
                  <button type="button" className="btn-boafo btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setBidModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem", width: "fit-content" }}>
          {[["bookings", "Bookings"], ["jobs", "Browse Jobs"], ["earnings", "Earnings"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.55rem 1.25rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s",
              background: tab === t ? "#fff" : "transparent", color: tab === t ? "#473C33" : "#6B5B4E",
              boxShadow: tab === t ? "0 2px 8px rgba(71,60,51,0.1)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {/* Bookings */}
        {tab === "bookings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(bookings as any[]).length === 0 && <p style={{ color: "#6B5B4E", textAlign: "center", padding: "3rem" }}>No bookings yet. Browse open jobs to place bids.</p>}
            {(bookings as any[]).map((b: any) => (
              <div key={b.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#473C33" }}>Booking #{b.id}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    {b.quotedPrice && <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ABC270" }}>GH₵ {b.quotedPrice}</p>}
                    {b.notes && <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginTop: "0.25rem" }}>{b.notes}</p>}
                    {b.scheduledStartTime && <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginTop: "0.25rem" }}>📅 {new Date(b.scheduledStartTime).toLocaleDateString()}</p>}
                  </div>
                  {b.status === "pending" && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }} onClick={() => acceptMutation.mutate(b.id)}>Accept</button>
                      <button className="btn-boafo btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", color: "#E05A3A", borderColor: "#E05A3A" }} onClick={() => declineMutation.mutate(b.id)}>Decline</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Browse jobs */}
        {tab === "jobs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(openJobs as any[]).length === 0 && <p style={{ color: "#6B5B4E", textAlign: "center", padding: "3rem" }}>No open jobs right now.</p>}
            {(openJobs as any[]).map((j: any) => (
              <div key={j.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.875rem" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>{j.title}</h3>
                    <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.5, marginBottom: "0.625rem" }}>{j.description?.slice(0, 120)}…</p>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#6B5B4E" }}>
                      {j.budget && <span style={{ fontWeight: 700, color: "#473C33" }}>Budget: GH₵ {j.budget}</span>}
                      {j.location && <span>📍 {j.location}</span>}
                    </div>
                  </div>
                  <button className="btn-boafo btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem", alignSelf: "flex-start" }}
                    onClick={() => setBidModal({ jobId: j.id, title: j.title })}>
                    Place Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Earnings */}
        {tab === "earnings" && (
          <div className="boafo-card" style={{ padding: "2rem", maxWidth: 480 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Earnings Summary</h2>
            {earnings ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[["Total Earned", earnings.totalEarned || "0", "#8FA853"], ["Available for Payout", earnings.availableForPayout || "0", "#ABC270"], ["Pending (Escrow)", earnings.pendingEscrow || "0", "#FDA769"]].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#FFF8EE", borderRadius: "0.75rem", border: "1px solid #E8D9BF" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6B5B4E" }}>{l}</span>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: c }}>GH₵ {v}</span>
                  </div>
                ))}
                <button className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>Request Payout</button>
              </div>
            ) : (
              <p style={{ color: "#6B5B4E" }}>No earnings data yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

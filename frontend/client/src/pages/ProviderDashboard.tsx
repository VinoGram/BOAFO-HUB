import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, jobsApi, providersApi, profileApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock, Hammer, CheckCircle2, Star, Pencil, X,
  MapPin, DollarSign, Calendar, Send, Briefcase,
  TrendingUp, Wallet, Hourglass, CreditCard, LogOut, User,
  Phone, Mail, ChevronDown, ChevronUp,
} from "lucide-react";

const NEO_BG = "#EEE8DF";
const neo = (inset = false) =>
  inset
    ? "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff"
    : "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff";

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pending", "#FEC868"], accepted: ["Accepted", "#ABC270"],
    declined: ["Declined", "#E05A3A"], completed: ["Completed", "#8FA853"],
    in_progress: ["In Progress", "#FDA769"], open: ["Open", "#ABC270"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return (
    <span style={{ background: `${color}18`, border: `1.5px solid ${color}40`, color, borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>
      {label}
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  return (
    <div style={{ background: NEO_BG, borderRadius: "1.25rem", padding: "1.5rem 1.25rem", boxShadow: neo(), display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div style={{ width: 38, height: 38, borderRadius: "0.75rem", background: NEO_BG, boxShadow: neo(true), display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <p style={{ fontSize: "0.72rem", color: "#8A7A6E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function ProviderDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [tab, setTab] = useState("bookings");
  const [bidModal, setBidModal] = useState<{ jobId: number; title: string } | null>(null);
  const [bidForm, setBidForm] = useState({ amount: "", message: "", estimatedDays: "" });
  const [profileForm, setProfileForm] = useState({ bio: "", hourlyRate: "", yearsOfExperience: "" });
  const [showProfile, setShowProfile] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: bookings = [] } = useQuery({ queryKey: ["my-bookings-provider"], queryFn: bookingsApi.getByProvider, enabled: tab === "bookings" });
  const { data: openJobs = [] } = useQuery({ queryKey: ["open-jobs"], queryFn: () => jobsApi.list(30, 0), enabled: tab === "jobs" });
  const { data: profile } = useQuery({ queryKey: ["my-provider-profile"], queryFn: providersApi.getProfile });
  const { data: earnings } = useQuery({ queryKey: ["earnings"], queryFn: providersApi.getTotalEarnings, enabled: tab === "earnings" });
  const { data: myProfile } = useQuery({ queryKey: ["my-profile"], queryFn: profileApi.getMe });

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

  const pending   = (bookings as any[]).filter((b: any) => b.status === "pending").length;
  const active    = (bookings as any[]).filter((b: any) => ["accepted", "in_progress"].includes(b.status)).length;
  const completed = (bookings as any[]).filter((b: any) => b.status === "completed").length;
  const rating    = profile ? parseFloat(profile.averageRating || "0").toFixed(1) : "–";

  const TABS = [["bookings", "Bookings"], ["jobs", "Browse Jobs"], ["earnings", "Earnings"]];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.75rem",
    border: "none", background: NEO_BG, boxShadow: neo(true),
    fontSize: "0.875rem", color: "#473C33", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: NEO_BG, fontFamily: "'Inter',sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: NEO_BG, boxShadow: "0 4px 12px #d4cec6", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "0.875rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <div style={{ flex: 1 }} />
          <a href={`/user/${user?.id}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#6B5B4E", textDecoration: "none", fontWeight: 500 }}>
            {myProfile?.profilePictureUrl ? (
              <img src={myProfile.profilePictureUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", boxShadow: neo() }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: NEO_BG, boxShadow: neo(), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={15} color="#ABC270" />
              </div>
            )}
            {user?.name}
          </a>
          <button onClick={() => setShowProfile(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.625rem", padding: "0.4rem 0.875rem", fontSize: "0.8rem", fontWeight: 600, color: "#473C33", cursor: "pointer" }}>
            <Pencil size={13} color="#ABC270" /> Edit Profile
          </button>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 5, background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.625rem", padding: "0.4rem 0.875rem", fontSize: "0.8rem", fontWeight: 600, color: "#6B5B4E", cursor: "pointer" }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>

        {/* Hero */}
        <div style={{ background: NEO_BG, borderRadius: "1.5rem", padding: "1.75rem 2rem", marginBottom: "2rem", boxShadow: neo(), display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.82rem", color: "#8A7A6E", marginBottom: "0.2rem" }}>Welcome back</p>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 0.25rem", color: "#473C33" }}>{user?.name}</h1>
            <p style={{ fontSize: "0.8rem", color: "#6B5B4E", margin: 0 }}>
              {profile?.plan || "Provider"} Plan
              {profile?.verificationStatus === "id_verified" && " · Verified ✓"}
            </p>
          </div>
          <div style={{ background: NEO_BG, borderRadius: "1.25rem", padding: "1rem 1.5rem", boxShadow: neo(true), textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Star size={22} fill="#FEC868" color="#FEC868" />
              <span style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, color: "#473C33" }}>{rating}</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#8A7A6E", margin: "0.25rem 0 0" }}>{profile?.totalReviews || 0} reviews</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard icon={<Clock size={18} color="#FDA769" />}        label="Pending"   value={pending}   color="#FDA769" />
          <StatCard icon={<Hammer size={18} color="#ABC270" />}       label="Active"    value={active}    color="#ABC270" />
          <StatCard icon={<CheckCircle2 size={18} color="#8FA853" />} label="Completed" value={completed} color="#8FA853" />
          <StatCard icon={<Star size={18} color="#FEC868" />}         label="Rating"    value={rating}    color="#FEC868" />
        </div>

        {/* Edit Profile Modal */}
        {showProfile && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: NEO_BG, borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 460, boxShadow: neo() }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#473C33", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Pencil size={16} color="#ABC270" /> Update Profile
                </h2>
                <button onClick={() => setShowProfile(false)} style={{ background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#8A7A6E", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate({ bio: profileForm.bio || undefined, hourlyRate: profileForm.hourlyRate || undefined, yearsOfExperience: profileForm.yearsOfExperience ? Number(profileForm.yearsOfExperience) : undefined }); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Bio</label>
                  <textarea style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="Describe your skills…" value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Hourly Rate (GH₵)</label>
                    <input style={inputStyle} type="number" placeholder="e.g. 80" value={profileForm.hourlyRate} onChange={e => setProfileForm(f => ({ ...f, hourlyRate: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Years Experience</label>
                    <input style={inputStyle} type="number" placeholder="e.g. 5" value={profileForm.yearsOfExperience} onChange={e => setProfileForm(f => ({ ...f, yearsOfExperience: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Saving…" : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setShowProfile(false)} style={{ flex: 1, justifyContent: "center", background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.75rem", padding: "0.65rem", fontWeight: 600, fontSize: "0.875rem", color: "#6B5B4E", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bid Modal */}
        {bidModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: NEO_BG, borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 440, boxShadow: neo() }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", margin: "0 0 0.25rem", display: "flex", alignItems: "center", gap: 7 }}>
                    <Briefcase size={16} color="#ABC270" /> Place a Bid
                  </h2>
                  <p style={{ color: "#6B5B4E", fontSize: "0.85rem", margin: 0 }}>{bidModal.title}</p>
                </div>
                <button onClick={() => setBidModal(null)} style={{ background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#8A7A6E", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); bidMutation.mutate({ jobId: bidModal.jobId, data: { jobId: bidModal.jobId, amount: bidForm.amount, message: bidForm.message, estimatedDays: bidForm.estimatedDays ? Number(bidForm.estimatedDays) : undefined } }); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Price (GH₵)</label>
                    <input style={inputStyle} type="number" required placeholder="e.g. 250" value={bidForm.amount} onChange={e => setBidForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Est. Days</label>
                    <input style={inputStyle} type="number" placeholder="e.g. 2" value={bidForm.estimatedDays} onChange={e => setBidForm(f => ({ ...f, estimatedDays: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Message</label>
                  <textarea style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="Why should they choose you?" value={bidForm.message} onChange={e => setBidForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }} disabled={bidMutation.isPending}>
                    <Send size={14} /> {bidMutation.isPending ? "Submitting…" : "Submit Bid"}
                  </button>
                  <button type="button" onClick={() => setBidModal(null)} style={{ flex: 1, justifyContent: "center", background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.75rem", padding: "0.65rem", fontWeight: 600, fontSize: "0.875rem", color: "#6B5B4E", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", background: NEO_BG, borderRadius: "1rem", padding: 5, marginBottom: "1.75rem", width: "fit-content", gap: 4, boxShadow: neo(true) }}>
          {TABS.map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s", background: tab === t ? NEO_BG : "transparent", color: tab === t ? "#473C33" : "#8A7A6E", boxShadow: tab === t ? neo() : "none" }}>{l}</button>
          ))}
        </div>

        {/* Bookings */}
        {tab === "bookings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {(bookings as any[]).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: NEO_BG, borderRadius: "1.25rem", boxShadow: neo() }}>
                <Briefcase size={40} color="#C8BFB5" style={{ marginBottom: "0.75rem" }} />
                <p style={{ color: "#6B5B4E", fontWeight: 600, marginBottom: "0.25rem" }}>No bookings yet</p>
                <p style={{ color: "#8A7A6E", fontSize: "0.85rem" }}>Browse open jobs and place bids to get started.</p>
              </div>
            )}
            {(bookings as any[]).map((b: any) => (
              <div key={b.id} style={{ background: NEO_BG, borderRadius: "1.25rem", padding: "1.5rem", boxShadow: neo() }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Booking #{b.id}</span>
                      <Badge status={b.status} />
                    </div>
                    {b.quotedPrice && (
                      <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ABC270", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: 5 }}>
                        <DollarSign size={16} color="#ABC270" /> GH₵ {b.quotedPrice}
                      </p>
                    )}
                    {b.notes && <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.55 }}>{b.notes}</p>}
                    {b.scheduledStartTime && (
                      <p style={{ fontSize: "0.8rem", color: "#8A7A6E", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={13} /> {new Date(b.scheduledStartTime).toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                  {b.status === "pending" && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: 5, background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.625rem", padding: "0.45rem 1.1rem", fontSize: "0.8rem", fontWeight: 600, color: "#8FA853", cursor: "pointer" }} onClick={() => acceptMutation.mutate(b.id)}>
                        <CheckCircle2 size={13} /> Accept
                      </button>
                      <button style={{ display: "flex", alignItems: "center", gap: 5, background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.625rem", padding: "0.45rem 1.1rem", fontSize: "0.8rem", fontWeight: 600, color: "#E05A3A", cursor: "pointer" }} onClick={() => declineMutation.mutate(b.id)}>
                        <X size={13} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "1rem" }}>
            <img src={lightbox} alt="" style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: "1rem", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }} />
          </div>
        )}

        {/* Browse Jobs */}
        {tab === "jobs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {(openJobs as any[]).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: NEO_BG, borderRadius: "1.25rem", boxShadow: neo() }}>
                <Briefcase size={40} color="#C8BFB5" style={{ marginBottom: "0.75rem" }} />
                <p style={{ color: "#6B5B4E", fontWeight: 600 }}>No open jobs right now</p>
                <p style={{ color: "#8A7A6E", fontSize: "0.85rem" }}>Check back soon — new jobs are posted daily.</p>
              </div>
            )}
            {(openJobs as any[]).map((j: any) => {
              const expanded = expandedJob === j.id;
              const images: string[] = j.imageUrls || [];
              return (
                <div key={j.id} style={{ background: NEO_BG, borderRadius: "1.25rem", padding: "1.5rem", boxShadow: neo() }}>

                  {/* ── Customer profile row ── */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "0.875rem", borderBottom: "1px solid #D8D0C8" }}>
                    {j.customerAvatar ? (
                      <img src={j.customerAvatar} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0, boxShadow: neo() }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: NEO_BG, boxShadow: neo(), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={17} color="#ABC270" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#473C33", margin: "0 0 3px" }}>{j.customerName || "Customer"}</p>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {j.customerPhone && (
                          <a href={`tel:${j.customerPhone}`} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.75rem", color: "#6B5B4E", textDecoration: "none" }}>
                            <Phone size={11} color="#ABC270" />{j.customerPhone}
                          </a>
                        )}
                        {j.customerEmail && (
                          <a href={`mailto:${j.customerEmail}`} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.75rem", color: "#6B5B4E", textDecoration: "none" }}>
                            <Mail size={11} color="#ABC270" />{j.customerEmail}
                          </a>
                        )}
                        {(j.customerAddress || j.location) && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.75rem", color: "#6B5B4E" }}>
                            <MapPin size={11} color="#ABC270" />{j.customerAddress || j.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Job details ── */}
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.875rem" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "0.375rem" }}>{j.title}</h3>
                      <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.6, marginBottom: "0.625rem" }}>
                        {expanded ? j.description : `${j.description?.slice(0, 130)}${j.description?.length > 130 ? "…" : ""}`}
                      </p>

                      <div style={{ display: "flex", gap: "0.875rem", fontSize: "0.8rem", flexWrap: "wrap", marginBottom: "0.625rem" }}>
                        {j.budget && <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: "#473C33" }}><DollarSign size={12} />GH₵ {j.budget}</span>}
                        {j.location && <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B5B4E" }}><MapPin size={12} />{j.location}</span>}
                        {j.preferredStartDate && <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6B5B4E" }}><Calendar size={12} />{new Date(j.preferredStartDate).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}</span>}
                      </div>

                      {/* Job images */}
                      {images.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.625rem" }}>
                          {images.map((url: string, i: number) => (
                            <img key={i} src={url} alt={`photo ${i + 1}`}
                              onClick={() => setLightbox(url)}
                              style={{ width: 76, height: 58, objectFit: "cover", borderRadius: "0.625rem", border: "1.5px solid #D8D0C8", cursor: "zoom-in", boxShadow: neo() }} />
                          ))}
                        </div>
                      )}

                      {j.description?.length > 130 && (
                        <button onClick={() => setExpandedJob(expanded ? null : j.id)}
                          style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                          {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
                        </button>
                      )}
                    </div>

                    <button style={{ display: "flex", alignItems: "center", gap: 6, background: NEO_BG, boxShadow: neo(), border: "none", borderRadius: "0.75rem", padding: "0.55rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, color: "#ABC270", cursor: "pointer", alignSelf: "flex-start" }}
                      onClick={() => setBidModal({ jobId: j.id, title: j.title })}>
                      <Briefcase size={14} /> Place Bid
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Earnings */}
        {tab === "earnings" && (
          <div style={{ maxWidth: 520 }}>
            <div style={{ background: NEO_BG, borderRadius: "1.5rem", padding: "2rem", boxShadow: neo() }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} color="#ABC270" /> Earnings Summary
              </h2>
              {earnings ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {[
                    [<Wallet size={16} />,    "Total Earned",         earnings.totalEarned || "0",        "#8FA853"],
                    [<CreditCard size={16} />, "Available for Payout", earnings.availableForPayout || "0", "#ABC270"],
                    [<Hourglass size={16} />, "Pending (Escrow)",     earnings.pendingEscrow || "0",      "#FDA769"],
                  ].map(([icon, l, v, c]: any) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: NEO_BG, borderRadius: "0.875rem", boxShadow: neo(true) }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "#6B5B4E", fontWeight: 500 }}>
                        <span style={{ color: c }}>{icon}</span>{l}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: "1.15rem", color: c }}>GH₵ {v}</span>
                    </div>
                  ))}
                  <button className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 7 }}>
                    <CreditCard size={15} /> Request Payout
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <TrendingUp size={40} color="#C8BFB5" style={{ marginBottom: "0.75rem" }} />
                  <p style={{ color: "#6B5B4E" }}>No earnings data yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

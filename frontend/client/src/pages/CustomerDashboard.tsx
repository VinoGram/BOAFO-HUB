import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, bookingsApi, categoriesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MapPin, Camera, X, Navigation, Pencil } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ["Open", "#ABC270"], in_progress: ["In Progress", "#FDA769"],
    completed: ["Completed", "#8FA853"], cancelled: ["Cancelled", "#999"],
    pending: ["Pending", "#FEC868"], accepted: ["Accepted", "#ABC270"],
    declined: ["Declined", "#E05A3A"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return <span style={{ background: `${color}20`, border: `1px solid ${color}50`, color, borderRadius: 9999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{label}</span>;
}

function DashNav({ user, logout }: { user: any; logout: () => void }) {
  const [, navigate] = useLocation();
  return (
    <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
        <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
        <div style={{ flex: 1 }} />
        <a href="/search" className="nav-link" style={{ fontSize: "0.875rem" }}>Browse</a>
        <span style={{ fontSize: "0.875rem", color: "#6B5B4E" }}>{user?.name}</span>
        <button className="btn-boafo btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [tab, setTab] = useState("jobs");
  const [showPostJob, setShowPostJob] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", description: "", tradeCategoryId: "", budget: "", location: "", latitude: "", longitude: "" });
  const [jobImages, setJobImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [locMode, setLocMode] = useState<"manual" | "gps">("manual");
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const qc = useQueryClient();

  const { data: myJobs = [] } = useQuery({ queryKey: ["my-jobs"], queryFn: jobsApi.getByCustomer, enabled: tab === "jobs" });
  const { data: myBookings = [] } = useQuery({ queryKey: ["my-bookings-customer"], queryFn: bookingsApi.getByCustomer, enabled: tab === "bookings" });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const postJobMutation = useMutation({
    mutationFn: (data: FormData) => jobsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      setShowPostJob(false);
      setJobForm({ title: "", description: "", tradeCategoryId: "", budget: "", location: "", latitude: "", longitude: "" });
      setJobImages([]);
      setImagePreviews([]);
    },
    onError: (e: any) => setErr(e.message),
  });

  const completeBookingMutation = useMutation({
    mutationFn: bookingsApi.complete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bookings-customer"] }),
  });

  const stats = {
    active: (myJobs as any[]).filter((j: any) => j.status === "open").length,
    inProgress: (myJobs as any[]).filter((j: any) => j.status === "in_progress").length,
    completed: (myJobs as any[]).filter((j: any) => j.status === "completed").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <DashNav user={user} logout={logout} />

      <div className="container" style={{ padding: "2rem 1.25rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#473C33", marginBottom: "0.25rem" }}>My Dashboard</h1>
            <p style={{ color: "#6B5B4E", fontSize: "0.9rem" }}>Welcome back, {user?.name}</p>
          </div>
          <button className="btn-boafo btn-primary" onClick={() => setShowPostJob(true)}>+ Post New Job</button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {[["Active Jobs", stats.active, "#ABC270"], ["In Progress", stats.inProgress, "#FDA769"], ["Completed", stats.completed, "#8FA853"], ["Bookings", (myBookings as any[]).length, "#FEC868"]].map(([label, val, color]) => (
            <div key={label as string} className="boafo-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>{label as string}</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: color as string }}>{val as number}</p>
            </div>
          ))}
        </div>

        {/* Post Job Modal */}
        {showPostJob && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Post a New Job</h2>
              <form onSubmit={(e) => {
                e.preventDefault(); setErr("");
                const fd = new FormData();
                fd.append("title", jobForm.title);
                fd.append("description", jobForm.description);
                fd.append("tradeCategoryId", jobForm.tradeCategoryId);
                if (jobForm.budget) fd.append("budget", jobForm.budget);
                if (jobForm.location) fd.append("location", jobForm.location);
                if (jobForm.latitude) fd.append("latitude", jobForm.latitude);
                if (jobForm.longitude) fd.append("longitude", jobForm.longitude);
                jobImages.forEach(img => fd.append("images", img));
                postJobMutation.mutate(fd);
              }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                <div><label className="boafo-label">Job Title</label><input className="boafo-input" placeholder="e.g. Fix leaking kitchen pipe" value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} required /></div>
                <div><label className="boafo-label">Description</label><textarea className="boafo-input" rows={3} placeholder="Describe the problem in detail…" value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: "none" }} /></div>
                <div><label className="boafo-label">Trade Category</label>
                  <select className="boafo-input" value={jobForm.tradeCategoryId} onChange={e => setJobForm(f => ({ ...f, tradeCategoryId: e.target.value }))} required>
                    <option value="">Select category</option>
                    {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Location — dual mode */}
                <div>
                  <label className="boafo-label">Location</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {(["manual", "gps"] as const).map(m => (
                      <button key={m} type="button"
                        onClick={() => {
                          setLocMode(m);
                          if (m === "gps") {
                            setGpsLoading(true);
                            navigator.geolocation.getCurrentPosition(
                              async (pos) => {
                                const { latitude, longitude } = pos.coords;
                                setJobForm(f => ({ ...f, latitude: String(latitude), longitude: String(longitude) }));
                                try {
                                  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                                  const d = await r.json();
                                  setJobForm(f => ({ ...f, location: d.display_name?.split(",").slice(0, 3).join(",") || "" }));
                                } catch {}
                                setGpsLoading(false);
                              },
                              () => { setGpsLoading(false); setErr("Location access denied"); }
                            );
                          }
                        }}
                        style={{ padding: "0.3rem 0.9rem", borderRadius: 9999, border: "1.5px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                          borderColor: locMode === m ? "#ABC270" : "#E8D9BF",
                          background: locMode === m ? "rgba(171,194,112,0.12)" : "transparent",
                          color: locMode === m ? "#8FA853" : "#6B5B4E" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>{m === "manual" ? <><Pencil size={12} /> Type</> : <><Navigation size={12} /> Use GPS</>}</span>
                      </button>
                    ))}
                  </div>
                  {gpsLoading && <p style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", color: "#6B5B4E" }}><Navigation size={13} />Getting location…</p>}
                  <input className="boafo-input" placeholder="City / area or GPS will fill this" value={jobForm.location}
                    onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} readOnly={locMode === "gps" && !gpsLoading} />
                  {jobForm.latitude && <p style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#8FA853", marginTop: "0.25rem" }}><MapPin size={12} />{parseFloat(jobForm.latitude).toFixed(5)}, {parseFloat(jobForm.longitude).toFixed(5)}</p>}
                </div>

                <div><label className="boafo-label">Budget (GH₵)</label><input className="boafo-input" type="number" placeholder="Optional" value={jobForm.budget} onChange={e => setJobForm(f => ({ ...f, budget: e.target.value }))} /></div>

                {/* Image upload */}
                <div>
                  <label className="boafo-label">Photos of the Problem (optional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: "2px dashed #E8D9BF", borderRadius: "0.875rem", padding: "1.25rem", textAlign: "center", cursor: "pointer", background: "#FAFAF8" }}>
                    <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", color: "#6B5B4E", fontSize: "0.85rem" }}><Camera size={15} /> Click to add photos</p>
                    <p style={{ color: "#999", fontSize: "0.75rem" }}>Up to 5 images</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                    onChange={e => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      setJobImages(files);
                      setImagePreviews(files.map(f => URL.createObjectURL(f)));
                    }} />
                  {imagePreviews.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                      {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={src} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "0.625rem", border: "1.5px solid #E8D9BF" }} />
                          <button type="button" onClick={() => {
                            setJobImages(imgs => imgs.filter((_, j) => j !== i));
                            setImagePreviews(ps => ps.filter((_, j) => j !== i));
                          }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#E05A3A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {err && <div style={{ color: "#C0392B", fontSize: "0.875rem", background: "rgba(224,90,58,0.08)", borderRadius: "0.625rem", padding: "0.625rem 0.875rem" }}>{err}</div>}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={postJobMutation.isPending}>{postJobMutation.isPending ? "Posting…" : "Post Job"}</button>
                  <button type="button" className="btn-boafo btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setShowPostJob(false); setJobImages([]); setImagePreviews([]); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem", width: "fit-content" }}>
          {["jobs", "bookings"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.55rem 1.5rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s", textTransform: "capitalize",
              background: tab === t ? "#fff" : "transparent", color: tab === t ? "#473C33" : "#6B5B4E",
              boxShadow: tab === t ? "0 2px 8px rgba(71,60,51,0.1)" : "none",
            }}>{t === "jobs" ? "My Jobs" : "My Bookings"}</button>
          ))}
        </div>

        {/* Jobs */}
        {tab === "jobs" && (
          (myJobs as any[]).length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <p style={{ color: "#6B5B4E", marginBottom: "1rem" }}>No jobs posted yet.</p>
              <button className="btn-boafo btn-primary" onClick={() => setShowPostJob(true)}>Post Your First Job</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(myJobs as any[]).map((j: any) => (
                <div key={j.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{j.title}</h3>
                        <StatusBadge status={j.status} />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.5rem" }}>{j.description?.slice(0, 100)}…</p>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#6B5B4E" }}>
                        {j.budget && <span>GH₵ {j.budget}</span>}
                        {j.location && <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={12} />{j.location}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <a href={`/job/${j.id}`} className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>View Bids</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          (myBookings as any[]).length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <p style={{ color: "#6B5B4E" }}>No bookings yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(myBookings as any[]).map((b: any) => (
                <div key={b.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#473C33" }}>Booking #{b.id}</h3>
                        <StatusBadge status={b.status} />
                      </div>
                      {b.quotedPrice && <p style={{ fontSize: "0.875rem", color: "#473C33", fontWeight: 600 }}>GH₵ {b.quotedPrice}</p>}
                      {b.notes && <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginTop: "0.375rem" }}>{b.notes}</p>}
                    </div>
                    {b.status === "accepted" && (
                      <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                        onClick={() => completeBookingMutation.mutate(b.id)}>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

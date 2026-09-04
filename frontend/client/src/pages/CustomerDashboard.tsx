import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, categoriesApi, profileApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MapPin, Camera, X, Navigation, Pencil, LogOut, User, MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";

const NEO = "#EEE8DF";
const neo = (inset = false): React.CSSProperties => ({
  background: NEO,
  borderRadius: "1.25rem",
  boxShadow: inset
    ? "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff"
    : "6px 6px 16px #d4cec6, -6px -6px 16px #ffffff",
});

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ["Open", "#ABC270"], in_progress: ["In Progress", "#FDA769"],
    completed: ["Completed", "#8FA853"], cancelled: ["Cancelled", "#999"],
    pending: ["Pending", "#FEC868"], accepted: ["Accepted", "#ABC270"],
    declined: ["Declined", "#E05A3A"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return (
    <span style={{ background: `${color}18`, border: `1.5px solid ${color}40`, color, borderRadius: 9999, padding: "3px 12px", fontSize: "0.7rem", fontWeight: 700 }}>
      {label}
    </span>
  );
}

function NeoCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...neo(), padding: "1.5rem", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{ ...neo(), padding: "1.25rem 1rem" }}>
      <p style={{ fontSize: "0.72rem", color: "#8A7A6E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1, margin: 0 }}>{value}</p>
    </div>
  );
}

function BrowseJobCard({ job, expanded, onToggle, commentText, onCommentChange, onCommentSubmit, submitting }: {
  job: any; expanded: boolean; onToggle: () => void;
  commentText: string; onCommentChange: (v: string) => void;
  onCommentSubmit: () => void; submitting: boolean;
}) {
  const qc = useQueryClient();
  const { data: comments = [] } = useQuery({
    queryKey: ["job-comments", job.id],
    queryFn: () => jobsApi.getComments(job.id),
    enabled: expanded,
  });

  return (
    <NeoCard>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
        {job.customerAvatar ? (
          <img src={job.customerAvatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#ABC270,#8FA853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={16} color="#fff" />
          </div>
        )}
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#473C33", margin: 0 }}>{job.customerName || "Customer"}</p>
          <p style={{ fontSize: "0.72rem", color: "#8A7A6E", margin: 0 }}>{new Date(job.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ marginLeft: "auto" }}><Badge status={job.status} /></div>
      </div>

      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", margin: "0 0 0.4rem" }}>{job.title}</h3>
      <p style={{ fontSize: "0.83rem", color: "#6B5B4E", lineHeight: 1.6, margin: "0 0 0.75rem" }}>{job.description}</p>

      <div style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", color: "#8A7A6E", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {job.budget && <span style={{ fontWeight: 700, color: "#ABC270" }}>GH₵ {job.budget}</span>}
        {job.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{job.location}</span>}
      </div>

      {job.imageUrls?.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {job.imageUrls.map((url: string, i: number) => (
            <img key={i} src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "0.625rem", boxShadow: "2px 2px 6px #d4cec6", cursor: "pointer" }}
              onClick={() => window.open(url, "_blank")} />
          ))}
        </div>
      )}

      <button onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#8A7A6E", fontSize: "0.82rem", fontWeight: 600, padding: 0 }}>
        <MessageCircle size={14} />
        {(comments as any[]).length > 0 ? `${(comments as any[]).length} comment${(comments as any[]).length !== 1 ? "s" : ""}` : "Comment"}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid #E8E0D6", paddingTop: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            {(comments as any[]).length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "#8A7A6E", textAlign: "center" }}>No comments yet. Be the first!</p>
            )}
            {(comments as any[]).map((c: any) => (
              <div key={c.id} style={{ display: "flex", gap: "0.625rem" }}>
                {c.authorAvatar ? (
                  <img src={c.authorAvatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#D4C5B0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={13} color="#8A7A6E" />
                  </div>
                )}
                <div style={{ ...neo(true), padding: "0.5rem 0.875rem", flex: 1 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#473C33", margin: "0 0 0.2rem" }}>{c.authorName}</p>
                  <p style={{ fontSize: "0.82rem", color: "#6B5B4E", margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={commentText}
              onChange={e => onCommentChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentSubmit(); } }}
              placeholder="Write a comment…"
              style={{ ...neo(true), flex: 1, padding: "0.6rem 0.875rem", fontSize: "0.85rem", color: "#473C33", outline: "none" }}
            />
            <button onClick={onCommentSubmit} disabled={submitting || !commentText.trim()}
              style={{ ...neo(), padding: "0.6rem 0.875rem", background: "#ABC270", color: "#fff", border: "none", borderRadius: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", opacity: !commentText.trim() ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </NeoCard>
  );
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("browse");
  const [showPostJob, setShowPostJob] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [jobForm, setJobForm] = useState({ title: "", description: "", tradeCategoryId: "", budget: "", location: "", latitude: "", longitude: "" });
  const [jobImages, setJobImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [locMode, setLocMode] = useState<"manual" | "gps">("manual");
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const qc = useQueryClient();

  const { data: myJobs = [] } = useQuery({ queryKey: ["my-jobs"], queryFn: jobsApi.getByCustomer, enabled: tab === "jobs" });
  const { data: allJobs = [] } = useQuery({ queryKey: ["browse-jobs"], queryFn: () => jobsApi.list(50, 0), enabled: tab === "browse" });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: myProfile } = useQuery({ queryKey: ["my-profile"], queryFn: profileApi.getMe });

  const commentMutation = useMutation({
    mutationFn: ({ jobId, content }: { jobId: number; content: string }) => jobsApi.addComment(jobId, content),
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ["job-comments", jobId] });
      setCommentText(t => ({ ...t, [jobId]: "" }));
    },
  });

  const postJobMutation = useMutation({
    mutationFn: (data: FormData) => jobsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      setShowPostJob(false);
      setJobForm({ title: "", description: "", tradeCategoryId: "", budget: "", location: "", latitude: "", longitude: "" });
      setJobImages([]); setImagePreviews([]);
    },
    onError: (e: any) => setErr(e.message),
  });

  const stats = {
    active:     (myJobs as any[]).filter((j: any) => j.status === "open").length,
    inProgress: (myJobs as any[]).filter((j: any) => j.status === "in_progress").length,
    completed:  (myJobs as any[]).filter((j: any) => j.status === "completed").length,
  };

  const inputStyle: React.CSSProperties = { ...neo(true), width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#473C33", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: NEO, fontFamily: "'Inter',sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: NEO, borderBottom: "1px solid #D8D0C6", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(71,60,51,0.08)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "0.875rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <div style={{ flex: 1 }} />
          <a href={`/user/${user?.id}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#6B5B4E", textDecoration: "none", fontWeight: 500 }}>
            {myProfile?.profilePictureUrl ? (
              <img src={myProfile.profilePictureUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", boxShadow: "2px 2px 6px #d4cec6" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#ABC270,#8FA853)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 6px #d4cec6" }}>
                <User size={15} color="#fff" />
              </div>
            )}
            {user?.name}
          </a>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 5, ...neo(), padding: "0.4rem 0.875rem", fontSize: "0.8rem", fontWeight: 600, color: "#6B5B4E", cursor: "pointer", border: "none" }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#473C33", marginBottom: "0.2rem" }}>My Dashboard</h1>
            <p style={{ color: "#8A7A6E", fontSize: "0.875rem" }}>Welcome back, {user?.name}</p>
          </div>
          <button onClick={() => setShowPostJob(true)} style={{ ...neo(), padding: "0.7rem 1.5rem", background: "#ABC270", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: "4px 4px 10px #d4cec6, -2px -2px 6px #ffffff" }}>
            + Post New Job
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard label="Active Jobs"  value={stats.active}     color="#ABC270" />
          <StatCard label="In Progress"  value={stats.inProgress} color="#FDA769" />
          <StatCard label="Completed"    value={stats.completed}  color="#8FA853" />
        </div>

        {/* Post Job Modal */}
        {showPostJob && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ ...neo(), padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#473C33", margin: 0 }}>Post a New Job</h2>
                <button onClick={() => { setShowPostJob(false); setJobImages([]); setImagePreviews([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A7A6E" }}><X size={18} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault(); setErr("");
                const fd = new FormData();
                fd.append("title", jobForm.title); fd.append("description", jobForm.description);
                fd.append("tradeCategoryId", jobForm.tradeCategoryId);
                if (jobForm.budget) fd.append("budget", jobForm.budget);
                if (jobForm.location) fd.append("location", jobForm.location);
                if (jobForm.latitude) fd.append("latitude", jobForm.latitude);
                if (jobForm.longitude) fd.append("longitude", jobForm.longitude);
                jobImages.forEach(img => fd.append("images", img));
                postJobMutation.mutate(fd);
              }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Job Title</label>
                  <input style={inputStyle} placeholder="e.g. Fix leaking kitchen pipe" value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Description</label>
                  <textarea style={{ ...inputStyle, resize: "none" } as any} rows={3} placeholder="Describe the problem…" value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Category</label>
                  <select style={inputStyle} value={jobForm.tradeCategoryId} onChange={e => setJobForm(f => ({ ...f, tradeCategoryId: e.target.value }))} required>
                    <option value="">Select category</option>
                    {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Location</label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {(["manual", "gps"] as const).map(m => (
                      <button key={m} type="button" onClick={() => {
                        setLocMode(m);
                        if (m === "gps") {
                          setGpsLoading(true);
                          navigator.geolocation.getCurrentPosition(async pos => {
                            const { latitude, longitude } = pos.coords;
                            setJobForm(f => ({ ...f, latitude: String(latitude), longitude: String(longitude) }));
                            try {
                              const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                              const d = await r.json();
                              setJobForm(f => ({ ...f, location: d.display_name?.split(",").slice(0, 3).join(",") || "" }));
                            } catch {}
                            setGpsLoading(false);
                          }, () => { setGpsLoading(false); setErr("Location access denied"); });
                        }
                      }} style={{ padding: "0.3rem 0.9rem", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, ...(locMode === m ? { background: "#ABC270", color: "#fff", boxShadow: "2px 2px 6px #d4cec6" } : neo()) }}>
                        {m === "manual" ? <><Pencil size={11} />Type</> : <><Navigation size={11} />GPS</>}
                      </button>
                    ))}
                  </div>
                  {gpsLoading && <p style={{ fontSize: "0.8rem", color: "#8A7A6E", marginBottom: "0.4rem" }}>Getting location…</p>}
                  <input style={inputStyle} placeholder="City / area" value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} readOnly={locMode === "gps" && !gpsLoading} />
                  {jobForm.latitude && <p style={{ fontSize: "0.75rem", color: "#8FA853", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{parseFloat(jobForm.latitude).toFixed(4)}, {parseFloat(jobForm.longitude).toFixed(4)}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Budget (GH₵)</label>
                  <input style={inputStyle} type="number" placeholder="Optional" value={jobForm.budget} onChange={e => setJobForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Photos (optional)</label>
                  <div onClick={() => fileInputRef.current?.click()} style={{ ...neo(true), padding: "1rem", textAlign: "center", cursor: "pointer" }}>
                    <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#8A7A6E", fontSize: "0.85rem", margin: 0 }}><Camera size={14} />Click to add photos</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => {
                    const files = Array.from(e.target.files || []).slice(0, 5);
                    setJobImages(files); setImagePreviews(files.map(f => URL.createObjectURL(f)));
                  }} />
                  {imagePreviews.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                      {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={src} alt="" style={{ width: 68, height: 68, objectFit: "cover", borderRadius: "0.625rem", boxShadow: "2px 2px 6px #d4cec6" }} />
                          <button type="button" onClick={() => { setJobImages(imgs => imgs.filter((_, j) => j !== i)); setImagePreviews(ps => ps.filter((_, j) => j !== i)); }} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#E05A3A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {err && <p style={{ color: "#C0392B", fontSize: "0.85rem" }}>{err}</p>}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" disabled={postJobMutation.isPending} style={{ flex: 1, padding: "0.8rem", borderRadius: "0.875rem", background: "#ABC270", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", boxShadow: "3px 3px 8px #d4cec6" }}>
                    {postJobMutation.isPending ? "Posting…" : "Post Job"}
                  </button>
                  <button type="button" onClick={() => { setShowPostJob(false); setJobImages([]); setImagePreviews([]); }} style={{ flex: 1, padding: "0.8rem", borderRadius: "0.875rem", background: "transparent", color: "#6B5B4E", border: "1.5px solid #D4C5B0", fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", ...neo(), padding: 5, marginBottom: "1.75rem", width: "fit-content", gap: 2 }}>
          {[["browse", "Browse Jobs"], ["jobs", "My Jobs"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "0.6rem 1.25rem", borderRadius: "0.875rem", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s", ...(tab === t ? { background: "#ABC270", color: "#fff", boxShadow: "3px 3px 8px #d4cec6" } : { background: "transparent", color: "#8A7A6E" }) }}>{l}</button>
          ))}
        </div>

        {/* Browse Jobs */}
        {tab === "browse" && (
          (allJobs as any[]).length === 0 ? (
            <NeoCard style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <p style={{ color: "#8A7A6E" }}>No open jobs available right now.</p>
            </NeoCard>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {(allJobs as any[]).map((j: any) => (
                <BrowseJobCard key={j.id} job={j}
                  expanded={expandedComments === j.id}
                  onToggle={() => setExpandedComments(expandedComments === j.id ? null : j.id)}
                  commentText={commentText[j.id] || ""}
                  onCommentChange={(v) => setCommentText(t => ({ ...t, [j.id]: v }))}
                  onCommentSubmit={() => {
                    const text = (commentText[j.id] || "").trim();
                    if (text) commentMutation.mutate({ jobId: j.id, content: text });
                  }}
                  submitting={commentMutation.isPending}
                />
              ))}
            </div>
          )
        )}

        {/* Jobs */}
        {tab === "jobs" && (
          (myJobs as any[]).length === 0 ? (
            <NeoCard style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <p style={{ color: "#8A7A6E", marginBottom: "1rem" }}>No jobs posted yet.</p>
              <button onClick={() => setShowPostJob(true)} style={{ padding: "0.7rem 1.5rem", borderRadius: "0.875rem", background: "#ABC270", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", boxShadow: "3px 3px 8px #d4cec6" }}>Post Your First Job</button>
            </NeoCard>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(myJobs as any[]).map((j: any) => (
                <NeoCard key={j.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", margin: 0 }}>{j.title}</h3>
                        <Badge status={j.status} />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#8A7A6E", marginBottom: "0.5rem" }}>{j.description?.slice(0, 100)}…</p>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#8A7A6E" }}>
                        {j.budget && <span>GH₵ {j.budget}</span>}
                        {j.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{j.location}</span>}
                      </div>
                    </div>
                    <a href={`/job/${j.id}`} style={{ padding: "0.45rem 1rem", borderRadius: "0.75rem", background: "#ABC270", color: "#fff", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none", alignSelf: "flex-start", boxShadow: "2px 2px 6px #d4cec6" }}>View Bids</a>
                  </div>
                </NeoCard>
              ))}
            </div>
          )
        )}


      </div>
    </div>
  );
}

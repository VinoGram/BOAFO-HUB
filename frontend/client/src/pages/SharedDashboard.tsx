import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, categoriesApi, directChatApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MapPin, Camera, X, Navigation, Pencil, MessageCircle, Phone, CheckCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ["Open", "#ABC270"], in_progress: ["In Progress", "#FDA769"],
    completed: ["Completed", "#8FA853"], cancelled: ["Cancelled", "#999"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return (
    <span style={{ background: `${color}20`, border: `1px solid ${color}50`, color, borderRadius: 9999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>
      {label}
    </span>
  );
}

function PostJobModal({ categories, onClose, onSubmit, loading }: any) {
  const [form, setForm] = useState({ title: "", description: "", tradeCategoryId: "", budget: "", location: "", latitude: "", longitude: "" });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [locMode, setLocMode] = useState<"manual" | "gps">("manual");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("tradeCategoryId", form.tradeCategoryId);
    if (form.budget) fd.append("budget", form.budget);
    if (form.location) fd.append("location", form.location);
    if (form.latitude) fd.append("latitude", form.latitude);
    if (form.longitude) fd.append("longitude", form.longitude);
    images.forEach(img => fd.append("images", img));
    onSubmit(fd);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Post a Job</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div><label className="boafo-label">Title</label><input className="boafo-input" placeholder="e.g. Fix leaking pipe" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="boafo-label">Description</label><textarea className="boafo-input" rows={3} placeholder="Describe the problem…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: "none" }} /></div>
          <div>
            <label className="boafo-label">Category</label>
            <select className="boafo-input" value={form.tradeCategoryId} onChange={e => setForm(f => ({ ...f, tradeCategoryId: e.target.value }))} required>
              <option value="">Select category</option>
              {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="boafo-label">Location</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {(["manual", "gps"] as const).map(m => (
                <button key={m} type="button" onClick={() => {
                  setLocMode(m);
                  if (m === "gps") {
                    setGpsLoading(true);
                    navigator.geolocation.getCurrentPosition(async pos => {
                      const { latitude, longitude } = pos.coords;
                      setForm(f => ({ ...f, latitude: String(latitude), longitude: String(longitude) }));
                      try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        const d = await r.json();
                        setForm(f => ({ ...f, location: d.display_name?.split(",").slice(0, 3).join(",") || "" }));
                      } catch {}
                      setGpsLoading(false);
                    }, () => { setGpsLoading(false); setErr("Location access denied"); });
                  }
                }} style={{ padding: "0.3rem 0.9rem", borderRadius: 9999, border: "1.5px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, borderColor: locMode === m ? "#ABC270" : "#E8D9BF", background: locMode === m ? "rgba(171,194,112,0.12)" : "transparent", color: locMode === m ? "#8FA853" : "#6B5B4E" }}>
                  {m === "manual" ? <><Pencil size={11} style={{ marginRight: 4 }} />Type</> : <><Navigation size={11} style={{ marginRight: 4 }} />GPS</>}
                </button>
              ))}
            </div>
            {gpsLoading && <p style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>Getting location…</p>}
            <input className="boafo-input" placeholder="City / area" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} readOnly={locMode === "gps" && !gpsLoading} />
            {form.latitude && <p style={{ fontSize: "0.75rem", color: "#8FA853", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}</p>}
          </div>
          <div><label className="boafo-label">Budget (GH₵)</label><input className="boafo-input" type="number" placeholder="Optional" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
          <div>
            <label className="boafo-label">Photos (optional)</label>
            <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #E8D9BF", borderRadius: "0.875rem", padding: "1rem", textAlign: "center", cursor: "pointer" }}>
              <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#6B5B4E", fontSize: "0.85rem" }}><Camera size={14} />Add photos</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => {
              const files = Array.from(e.target.files || []).slice(0, 5);
              setImages(files); setPreviews(files.map(f => URL.createObjectURL(f)));
            }} />
            {previews.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt="" style={{ width: 68, height: 68, objectFit: "cover", borderRadius: "0.5rem", border: "1.5px solid #E8D9BF" }} />
                    <button type="button" onClick={() => { setImages(imgs => imgs.filter((_, j) => j !== i)); setPreviews(ps => ps.filter((_, j) => j !== i)); }} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#E05A3A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={9} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {err && <div style={{ color: "#C0392B", fontSize: "0.875rem" }}>{err}</div>}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>{loading ? "Posting…" : "Post Job"}</button>
            <button type="button" className="btn-boafo btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterestedProviders({ jobId, onChat }: { jobId: number; onChat: (providerId: number) => void }) {
  const { data: providers = [] } = useQuery({ queryKey: ["interests", jobId], queryFn: () => jobsApi.getInterests(jobId) });
  if (!(providers as any[]).length) return <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginTop: "0.5rem" }}>No providers interested yet.</p>;
  return (
    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#473C33" }}>Interested Providers</p>
      {(providers as any[]).map((p: any) => (
        <div key={p.providerId} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", background: "#FFF8EE", borderRadius: "0.75rem", border: "1px solid #E8D9BF" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8D9BF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#473C33", flexShrink: 0 }}>
            {p.name?.[0] || "P"}
          </div>
          <div style={{ flex: 1 }}>
            <a href={`/provider/${p.providerId}`} style={{ fontWeight: 600, fontSize: "0.85rem", color: "#473C33", textDecoration: "none" }}>{p.name}</a>
            {p.averageRating > 0 && <span style={{ fontSize: "0.75rem", color: "#FEC868", marginLeft: 6 }}>★ {parseFloat(p.averageRating).toFixed(1)}</span>}
          </div>
          <button onClick={() => onChat(p.providerId)} className="btn-boafo btn-primary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
            <MessageCircle size={12} /> Chat
          </button>
          {p.userPhone && (
            <a href={`tel:${p.userPhone}`} className="btn-boafo btn-outline" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
              <Phone size={12} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SharedDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const isCustomer = user?.role === "customer";
  const [tab, setTab] = useState("feed");
  const [showPost, setShowPost] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [interestedJobs, setInterestedJobs] = useState<Set<number>>(new Set());

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["open-jobs"],
    queryFn: () => jobsApi.list(50, 0),
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: jobsApi.getByCustomer,
    enabled: isCustomer && tab === "myjobs",
  });

  const { data: myChats = [] } = useQuery({
    queryKey: ["my-chats"],
    queryFn: directChatApi.listChats,
    enabled: tab === "chats",
  });

  const postMutation = useMutation({
    mutationFn: (fd: FormData) => jobsApi.create(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["open-jobs"] }); qc.invalidateQueries({ queryKey: ["my-jobs"] }); setShowPost(false); },
  });

  const interestMutation = useMutation({
    mutationFn: (jobId: number) => jobsApi.toggleInterest(jobId),
    onSuccess: (res, jobId) => {
      setInterestedJobs(prev => {
        const next = new Set(prev);
        res.interested ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["interests", jobId] });
    },
  });

  const startChatMutation = useMutation({
    mutationFn: (providerId: number) => directChatApi.startChat(providerId),
    onSuccess: (res) => navigate(`/chat/direct/${res.chatId}`),
  });

  const tabs = isCustomer
    ? [["feed", "Job Feed"], ["myjobs", "My Jobs"], ["chats", "Chats"]]
    : [["feed", "Job Feed"], ["chats", "Chats"]];

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: "0.875rem", color: "#6B5B4E" }}>{user?.name}</span>
          <span style={{ fontSize: "0.75rem", background: "#F5EDD8", border: "1px solid #E8D9BF", borderRadius: 9999, padding: "2px 10px", color: "#6B5B4E", textTransform: "capitalize" }}>{user?.role}</span>
          <button className="btn-boafo btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#473C33", marginBottom: "0.2rem" }}>Dashboard</h1>
            <p style={{ color: "#6B5B4E", fontSize: "0.875rem" }}>Welcome back, {user?.name}</p>
          </div>
          {isCustomer && <button className="btn-boafo btn-primary" onClick={() => setShowPost(true)}>+ Post Job</button>}
        </div>

        {showPost && (
          <PostJobModal
            categories={qc.getQueryData(["categories"]) || []}
            onClose={() => setShowPost(false)}
            onSubmit={(fd: FormData) => postMutation.mutate(fd)}
            loading={postMutation.isPending}
          />
        )}

        <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem", width: "fit-content" }}>
          {tabs.map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.55rem 1.25rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.875rem", transition: "all 0.2s",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#473C33" : "#6B5B4E",
              boxShadow: tab === t ? "0 2px 8px rgba(71,60,51,0.1)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {/* ── JOB FEED (both roles) ── */}
        {tab === "feed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {isLoading && <p style={{ color: "#6B5B4E", textAlign: "center", padding: "3rem" }}>Loading jobs…</p>}
            {!isLoading && (jobs as any[]).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <p style={{ color: "#6B5B4E", marginBottom: "1rem" }}>No open jobs yet.</p>
                {isCustomer && <button className="btn-boafo btn-primary" onClick={() => setShowPost(true)}>Post the First Job</button>}
              </div>
            )}
            {(jobs as any[]).map((j: any) => {
              const isExpanded = expandedJob === j.id;
              const isInterested = interestedJobs.has(j.id);
              return (
                <div key={j.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{j.title}</h3>
                        <StatusBadge status={j.status} />
                      </div>
                      <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.55, marginBottom: "0.5rem" }}>{j.description?.slice(0, 140)}{j.description?.length > 140 ? "…" : ""}</p>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#6B5B4E", flexWrap: "wrap" }}>
                        {j.budget && <span style={{ fontWeight: 700, color: "#473C33" }}>GH₵ {j.budget}</span>}
                        {j.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{j.location}</span>}
                      </div>
                      {j.imageUrls?.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                          {j.imageUrls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "0.5rem", border: "1.5px solid #E8D9BF" }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                      {!isCustomer && (
                        <button
                          className={isInterested ? "btn-boafo btn-secondary" : "btn-boafo btn-primary"}
                          style={{ padding: "0.45rem 1rem", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: 5 }}
                          onClick={() => interestMutation.mutate(j.id)}
                          disabled={interestMutation.isPending}
                        >
                          <CheckCircle size={14} />
                          {isInterested ? "Interested ✓" : "I'm Interested"}
                        </button>
                      )}
                      {isCustomer && (
                        <button
                          className="btn-boafo btn-outline"
                          style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                          onClick={() => setExpandedJob(isExpanded ? null : j.id)}
                        >
                          {isExpanded ? "Hide" : "View Interested"}
                        </button>
                      )}
                    </div>
                  </div>
                  {isCustomer && isExpanded && (
                    <InterestedProviders jobId={j.id} onChat={(providerId) => startChatMutation.mutate(providerId)} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MY JOBS (customer only) ── */}
        {tab === "myjobs" && isCustomer && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(myJobs as any[]).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <p style={{ color: "#6B5B4E", marginBottom: "1rem" }}>No jobs posted yet.</p>
                <button className="btn-boafo btn-primary" onClick={() => setShowPost(true)}>Post Your First Job</button>
              </div>
            )}
            {(myJobs as any[]).map((j: any) => (
              <div key={j.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.375rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{j.title}</h3>
                      <StatusBadge status={j.status} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.5rem" }}>{j.description?.slice(0, 100)}…</p>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#6B5B4E" }}>
                      {j.budget && <span>GH₵ {j.budget}</span>}
                      {j.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{j.location}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a href={`/job/${j.id}`} className="btn-boafo btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>View Bids</a>
                    <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }} onClick={() => setExpandedJob(expandedJob === j.id ? null : j.id)}>
                      Interested
                    </button>
                  </div>
                </div>
                {expandedJob === j.id && (
                  <InterestedProviders jobId={j.id} onChat={(providerId) => startChatMutation.mutate(providerId)} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CHATS ── */}
        {tab === "chats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(myChats as any[]).length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <p style={{ color: "#6B5B4E" }}>
                  {isCustomer ? "No chats yet. View a provider's profile to start a chat." : "No chats yet. Customers will reach out to you."}
                </p>
              </div>
            )}
            {(myChats as any[]).map((c: any) => {
              const name = isCustomer ? c.providerName : c.customerName;
              const avatar = isCustomer ? c.providerAvatar : c.customerAvatar;
              return (
                <div key={c.id} className="boafo-card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", cursor: "pointer" }} onClick={() => navigate(`/chat/direct/${c.id}`)}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E8D9BF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#473C33", flexShrink: 0, overflow: "hidden" }}>
                    {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (name?.[0] || "?")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#473C33", fontSize: "0.9rem" }}>{name}</p>
                    <p style={{ fontSize: "0.78rem", color: "#6B5B4E" }}>Tap to open chat</p>
                  </div>
                  <MessageCircle size={18} color="#ABC270" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

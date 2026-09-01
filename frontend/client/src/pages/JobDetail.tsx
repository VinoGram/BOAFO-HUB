import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, reviewsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MapPin } from "lucide-react";

function Stars({ n }: { n: number }) {
  return <span style={{ color: "#FEC868" }}>{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
}

function VerifiedBadge({ status }: { status: string }) {
  if (!["id_verified", "certified", "community_vouched"].includes(status)) return null;
  return <span style={{ background: "rgba(171,194,112,0.15)", border: "1px solid rgba(171,194,112,0.4)", color: "#8FA853", borderRadius: 9999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700 }}>✓ Verified</span>;
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const id = Number(jobId);

  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "", bookingId: 0, providerId: 0 });
  const [showReview, setShowReview] = useState(false);

  const { data: job, isLoading } = useQuery({ queryKey: ["job", id], queryFn: () => jobsApi.getById(id), enabled: !!id });
  const { data: bids = [] } = useQuery({ queryKey: ["job-bids", id], queryFn: () => jobsApi.getBids(id), enabled: !!id });

  const acceptBidMutation = useMutation({
    mutationFn: (bidId: number) => jobsApi.acceptBid(id, bidId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job", id] }); qc.invalidateQueries({ queryKey: ["job-bids", id] }); },
  });

  const reviewMutation = useMutation({
    mutationFn: (data: any) => reviewsApi.create(data),
    onSuccess: () => setShowReview(false),
  });

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#6B5B4E" }}>
      Loading job…
    </div>
  );

  if (!job) return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
        <p style={{ color: "#6B5B4E", marginBottom: "1rem" }}>Job not found.</p>
        <a href="/" className="btn-boafo btn-primary">Go Home</a>
      </div>
    </div>
  );

  const statusColor: Record<string, string> = { open: "#ABC270", in_progress: "#FDA769", completed: "#8FA853", cancelled: "#999" };
  const sc = statusColor[job.status] || "#999";
  const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <a href="/search" className="nav-link" style={{ fontSize: "0.875rem" }}>← Jobs</a>
          <div style={{ flex: 1 }} />
          {!isAuthenticated && <a href="/login" className="btn-boafo btn-primary" style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}>Sign In</a>}
        </div>
      </nav>

      <div className="container" style={{ padding: "2.5rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── Main content ── */}
          <div style={{ flex: "1 1 560px" }}>
            <div className="boafo-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#473C33", flex: 1 }}>{job.title}</h1>
                <span style={{ background: `${sc}20`, border: `1px solid ${sc}50`, color: sc, borderRadius: 9999, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {job.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <p style={{ color: "#6B5B4E", lineHeight: 1.75, marginBottom: "1.5rem" }}>{job.description}</p>

              {/* Job images */}
              {job.imageUrls?.length > 0 && (
                <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  {job.imageUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Job photo ${i + 1}`} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: "0.75rem", border: "1.5px solid #E8D9BF", cursor: "zoom-in" }} />
                    </a>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", paddingTop: "1.25rem", borderTop: "1px solid #E8D9BF" }}>
                {job.budget && <div><p style={{ fontSize: "0.72rem", color: "#6B5B4E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Budget</p><p style={{ fontWeight: 800, color: "#473C33", fontSize: "1.1rem" }}>GH₵ {job.budget}</p></div>}
                {job.location && <div><p style={{ fontSize: "0.72rem", color: "#6B5B4E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Location</p><p style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, color: "#473C33" }}><MapPin size={13} />{job.location}</p></div>}
                <div><p style={{ fontSize: "0.72rem", color: "#6B5B4E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Posted</p><p style={{ fontWeight: 600, color: "#473C33" }}>{daysAgo === 0 ? "Today" : `${daysAgo} days ago`}</p></div>
                <div><p style={{ fontSize: "0.72rem", color: "#6B5B4E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Bids</p><p style={{ fontWeight: 800, color: "#FDA769", fontSize: "1.1rem" }}>{(bids as any[]).length}</p></div>
              </div>
            </div>

            {/* ── Bids section ── */}
            <div className="boafo-card" style={{ padding: "1.75rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#473C33", marginBottom: "1.25rem" }}>
                Bids ({(bids as any[]).length})
              </h2>

              {(bids as any[]).length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <p style={{ color: "#6B5B4E" }}>No bids yet. {isAuthenticated && user?.role === "provider" ? "Be the first!" : ""}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {(bids as any[]).map((bid: any) => (
                    <div key={bid.id} style={{ padding: "1.25rem", background: bid.status === "accepted" ? "rgba(171,194,112,0.08)" : "#FAFAF8", borderRadius: "1rem", border: `1.5px solid ${bid.status === "accepted" ? "rgba(171,194,112,0.4)" : "#E8D9BF"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                          <div className="img-placeholder" style={{ width: 40, height: 40, minWidth: 40, borderRadius: "50%", fontSize: "0.65rem" }}><span style={{ padding: "0 4px", textAlign: "center" }}>Photo</span></div>
                          <div>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ fontWeight: 700, color: "#473C33", fontSize: "0.9rem" }}>{bid.providerName || "Provider"}</span>
                              <VerifiedBadge status={bid.verificationStatus} />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <Stars n={parseFloat(bid.averageRating) || 0} />
                              {bid.yearsOfExperience && <span style={{ fontSize: "0.75rem", color: "#6B5B4E" }}>{bid.yearsOfExperience} yrs exp</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 800, color: "#473C33", fontSize: "1.1rem" }}>GH₵ {bid.amount}</p>
                          {bid.estimatedDays && <p style={{ fontSize: "0.75rem", color: "#6B5B4E" }}>{bid.estimatedDays} day{bid.estimatedDays > 1 ? "s" : ""}</p>}
                        </div>
                      </div>
                      {bid.message && <p style={{ fontSize: "0.85rem", color: "#6B5B4E", lineHeight: 1.6, marginBottom: "0.75rem" }}>{bid.message}</p>}
                      {job.status === "open" && isAuthenticated && bid.status === "pending" && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
                            onClick={() => acceptBidMutation.mutate(bid.id)} disabled={acceptBidMutation.isPending}>
                            Accept This Bid
                          </button>
                          <a href={`/provider/${bid.providerId}`} className="btn-boafo btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>View Profile</a>
                        </div>
                      )}
                      {bid.status === "accepted" && <span style={{ display: "inline-block", background: "rgba(171,194,112,0.2)", color: "#8FA853", borderRadius: 9999, padding: "2px 12px", fontSize: "0.75rem", fontWeight: 700 }}>✓ Bid Accepted</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <div className="boafo-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#473C33", marginBottom: "1rem" }}>Actions</h3>
              {!isAuthenticated ? (
                <a href="/login" className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center" }}>Sign In to Bid</a>
              ) : user?.role === "provider" && job.status === "open" ? (
                <a href="/dashboard/provider" className="btn-boafo btn-primary" style={{ width: "100%", justifyContent: "center" }}>Place a Bid</a>
              ) : user?.role === "customer" && job.status === "completed" ? (
                <button className="btn-boafo btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowReview(true)}>
                  Leave a Review
                </button>
              ) : null}

              <a href="/search" className="btn-boafo btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", fontSize: "0.85rem" }}>Browse More Jobs</a>
            </div>

            <div className="boafo-card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#473C33", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>How it Works</h3>
              {[["1", "Customer posts a job"], ["2", "Providers place bids"], ["3", "Customer picks the best bid"], ["4", "Job is done & reviewed"]].map(([n, t]) => (
                <div key={n} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", marginBottom: "0.625rem" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#ABC270", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{n}</span>
                  <span style={{ fontSize: "0.8rem", color: "#6B5B4E" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(71,60,51,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: 440, fontFamily: "'Inter',sans-serif" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Leave a Review</h2>
            <form onSubmit={(e) => { e.preventDefault(); reviewMutation.mutate(reviewForm); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="boafo-label">Rating</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      style={{ fontSize: "1.5rem", background: "none", border: "none", cursor: "pointer", color: n <= reviewForm.rating ? "#FEC868" : "#E8D9BF" }}>★</button>
                  ))}
                </div>
              </div>
              <div><label className="boafo-label">Title</label><input className="boafo-input" placeholder="Summary" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="boafo-label">Comment</label><textarea className="boafo-input" rows={3} placeholder="Your experience…" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} style={{ resize: "none" }} /></div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn-boafo btn-primary" style={{ flex: 1, justifyContent: "center" }}>Submit</button>
                <button type="button" className="btn-boafo btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowReview(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

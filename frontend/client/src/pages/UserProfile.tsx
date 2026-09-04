import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { MapPin, Star, Briefcase, Clock, ShieldCheck, User } from "lucide-react";

function Stars({ n }: { n: number }) {
  const r = Math.round(n || 0);
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < r ? "#FEC868" : "none"} color={i < r ? "#FEC868" : "#D4C5B0"} />
      ))}
    </span>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    open: ["Open", "#ABC270"], in_progress: ["In Progress", "#FDA769"],
    completed: ["Completed", "#8FA853"], cancelled: ["Cancelled", "#999"],
  };
  const [label, color] = map[status] || [status, "#999"];
  return <span style={{ background: `${color}18`, border: `1.5px solid ${color}40`, color, borderRadius: 9999, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }}>{label}</span>;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => profileApi.getUser(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6B5B4E" }}>Loading profile…</p>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6B5B4E" }}>User not found.</p>
    </div>
  );

  const isProvider = profile.role === "provider";
  const rating = parseFloat(profile.averageRating || "0");

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>← Back</button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2.5rem 1.25rem", maxWidth: 760 }}>

        {/* Profile header */}
        <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", border: "1px solid #EDE3D0", boxShadow: "0 4px 24px rgba(71,60,51,0.07)", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#ABC270,#8FA853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "3px solid #E8D9BF" }}>
            {profile.profilePictureUrl
              ? <img src={profile.profilePictureUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <User size={36} color="#fff" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.375rem" }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#473C33", margin: 0 }}>{profile.name}</h1>
              <span style={{ background: isProvider ? "rgba(171,194,112,0.15)" : "rgba(253,167,105,0.15)", border: `1.5px solid ${isProvider ? "#ABC270" : "#FDA769"}`, color: isProvider ? "#8FA853" : "#E07A3A", borderRadius: 9999, padding: "2px 12px", fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize" }}>
                {profile.role}
              </span>
              {isProvider && profile.verificationStatus === "id_verified" && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ABC270", fontSize: "0.78rem", fontWeight: 700 }}>
                  <ShieldCheck size={14} /> Verified
                </span>
              )}
            </div>

            {isProvider && (
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.85rem", color: "#473C33", fontWeight: 700 }}>
                  <Stars n={rating} /> {rating.toFixed(1)} <span style={{ color: "#8A7A6E", fontWeight: 400 }}>({profile.totalReviews || 0} reviews)</span>
                </span>
                {profile.yearsOfExperience && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem", color: "#6B5B4E" }}><Clock size={13} />{profile.yearsOfExperience} yrs exp</span>}
                {profile.hourlyRate && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem", color: "#6B5B4E" }}><Briefcase size={13} />GH₵{profile.hourlyRate}/hr</span>}
              </div>
            )}

            {profile.bio && <p style={{ fontSize: "0.875rem", color: "#6B5B4E", lineHeight: 1.65, margin: "0.5rem 0 0" }}>{profile.bio}</p>}

            {isProvider && profile.serviceRegions?.length > 0 && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {profile.serviceRegions.map((r: string) => (
                  <span key={r} style={{ display: "flex", alignItems: "center", gap: 3, background: "#F5EDD8", border: "1px solid #E8D9BF", borderRadius: 9999, padding: "2px 10px", fontSize: "0.75rem", color: "#6B5B4E" }}>
                    <MapPin size={10} />{r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer: jobs history */}
        {!isProvider && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "1rem" }}>Job History</h2>
            {(profile.jobs || []).length === 0
              ? <p style={{ color: "#8A7A6E", fontSize: "0.875rem" }}>No jobs posted yet.</p>
              : (profile.jobs as any[]).map((j: any) => (
                <div key={j.id} style={{ background: "#fff", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #EDE3D0", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "#473C33", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{j.title}</p>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "#8A7A6E" }}>
                      {j.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{j.location}</span>}
                      {j.budget && <span>GH₵{j.budget}</span>}
                      <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge status={j.status} />
                </div>
              ))
            }
          </div>
        )}

        {/* Provider: reviews */}
        {isProvider && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "1rem" }}>Reviews</h2>
            {(profile.reviews || []).length === 0
              ? <p style={{ color: "#8A7A6E", fontSize: "0.875rem" }}>No reviews yet.</p>
              : (profile.reviews as any[]).map((r: any) => (
                <div key={r.id} style={{ background: "#fff", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #EDE3D0", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#473C33", marginBottom: "0.2rem" }}>{r.customerName || "Customer"}</p>
                      <Stars n={r.rating} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#8A7A6E" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.title && <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#473C33", marginBottom: "0.25rem" }}>{r.title}</p>}
                  {r.comment && <p style={{ fontSize: "0.825rem", color: "#6B5B4E", lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

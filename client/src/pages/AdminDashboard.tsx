import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <span style={{ background: `${color}20`, border: `1px solid ${color}50`, color, borderRadius: 9999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

const MOCK_VERIFICATIONS = [
  { id: 1, providerName: "Kofi Asante", trade: "Electrician", docs: ["National ID", "GNEC Certificate"], daysAgo: 2 },
  { id: 2, providerName: "Ama Mensah", trade: "Plumber", docs: ["National ID", "Portfolio"], daysAgo: 1 },
  { id: 3, providerName: "Kweku Boateng", trade: "Welder", docs: ["National ID", "Apprenticeship Cert", "Portfolio"], daysAgo: 3 },
];

const MOCK_DISPUTES = [
  { id: 1, job: "Roof repair – Tema", customer: "Alice B.", provider: "Mike D.", reason: "Incomplete work", status: "open", daysAgo: 3 },
  { id: 2, job: "Electrical wiring – Accra", customer: "Bob W.", provider: "John K.", reason: "Payment dispute", status: "under_review", daysAgo: 1 },
];

const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "HVAC", "Welding", "Roofing", "Painting", "Masonry"];

export default function AdminDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [tab, setTab] = useState("verification");
  const [verifications, setVerifications] = useState(MOCK_VERIFICATIONS);
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);

  const stats = [
    ["Total Users", "1,234", "#ABC270"],
    ["Verified Providers", "567", "#8FA853"],
    ["Pending Verifications", verifications.length, "#FDA769"],
    ["Open Disputes", disputes.filter(d => d.status === "open").length, "#E05A3A"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <span style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33" }}>BOAFO</span>
          <span style={{ fontSize: "0.75rem", background: "rgba(224,90,58,0.12)", color: "#E05A3A", borderRadius: 9999, padding: "2px 10px", fontWeight: 700 }}>ADMIN</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: "0.875rem", color: "#6B5B4E" }}>{user?.name}</span>
          <button className="btn-boafo btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#473C33", marginBottom: "0.25rem" }}>Admin Dashboard</h1>
          <p style={{ color: "#6B5B4E", fontSize: "0.9rem" }}>Platform management & oversight</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {stats.map(([label, val, color]) => (
            <div key={label as string} className="boafo-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>{label as string}</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: color as string }}>{val as any}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#F5EDD8", borderRadius: "0.75rem", padding: 4, marginBottom: "1.5rem", width: "fit-content" }}>
          {[["verification", "Verification Queue"], ["disputes", "Disputes"], ["categories", "Categories"], ["analytics", "Analytics"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0.55rem 1.1rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.8rem", transition: "all 0.2s",
              background: tab === t ? "#fff" : "transparent", color: tab === t ? "#473C33" : "#6B5B4E",
              boxShadow: tab === t ? "0 2px 8px rgba(71,60,51,0.1)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {/* Verification Queue */}
        {tab === "verification" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {verifications.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem", color: "#6B5B4E" }}>No pending verifications.</div>
            )}
            {verifications.map(v => (
              <div key={v.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div className="img-placeholder" style={{ width: 44, height: 44, minWidth: 44, borderRadius: "50%", fontSize: "0.65rem" }}><span>Photo</span></div>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{v.providerName}</h3>
                        <p style={{ fontSize: "0.8rem", color: "#ABC270", fontWeight: 600 }}>{v.trade}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                      {v.docs.map(d => (
                        <span key={d} style={{ background: "#F5EDD8", border: "1px solid #E8D9BF", borderRadius: 9999, padding: "2px 10px", fontSize: "0.75rem", color: "#6B5B4E" }}>{d}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#6B5B4E" }}>Submitted {v.daysAgo} day{v.daysAgo > 1 ? "s" : ""} ago</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <button className="btn-boafo btn-outline" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}>Review Docs</button>
                    <button className="btn-boafo btn-outline" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem", color: "#E05A3A", borderColor: "#E05A3A" }}
                      onClick={() => setVerifications(vs => vs.filter(x => x.id !== v.id))}>Reject</button>
                    <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}
                      onClick={() => setVerifications(vs => vs.filter(x => x.id !== v.id))}>Approve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disputes */}
        {tab === "disputes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {disputes.map(d => (
              <div key={d.id} className="boafo-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>{d.job}</h3>
                      <StatusBadge status={d.status} color={d.status === "open" ? "#E05A3A" : "#FDA769"} />
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>
                      <strong style={{ color: "#473C33" }}>{d.customer}</strong> vs <strong style={{ color: "#473C33" }}>{d.provider}</strong>
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>Reason: {d.reason}</p>
                    <p style={{ fontSize: "0.75rem", color: "#6B5B4E" }}>Opened {d.daysAgo} day{d.daysAgo > 1 ? "s" : ""} ago</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <button className="btn-boafo btn-outline" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}>View Details</button>
                    {d.status !== "resolved" && (
                      <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 0.875rem", fontSize: "0.8rem" }}
                        onClick={() => setDisputes(ds => ds.map(x => x.id === d.id ? { ...x, status: "resolved" } : x))}>
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories */}
        {tab === "categories" && (
          <div className="boafo-card" style={{ padding: "1.75rem", maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33" }}>Trade Categories</h3>
              <button className="btn-boafo btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>+ Add Category</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {CATEGORIES.map(cat => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "#FFF8EE", borderRadius: "0.75rem", border: "1px solid #E8D9BF" }}>
                  <span style={{ fontWeight: 600, color: "#473C33", fontSize: "0.9rem" }}>{cat}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn-boafo btn-outline" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>Edit</button>
                    <button className="btn-boafo btn-outline" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", color: "#E05A3A", borderColor: "#E05A3A" }}>Disable</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {tab === "analytics" && (
          <div className="grid-2">
            {[
              ["Jobs Posted (30 days)", [12,18,24,19,28,35,30,22,40,38,45,42]],
              ["New Users (30 days)", [5,8,12,7,15,20,18,10,22,19,25,23]],
            ].map(([title, data]) => (
              <div key={title as string} className="boafo-card" style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#473C33", marginBottom: "1.25rem" }}>{title as string}</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 120 }}>
                  {(data as number[]).map((v, i) => {
                    const max = Math.max(...(data as number[]));
                    return (
                      <div key={i} style={{ flex: 1, background: i === (data as number[]).length - 1 ? "#ABC270" : "#E8D9BF", borderRadius: "4px 4px 0 0", height: `${(v / max) * 100}%`, transition: "height 0.3s", minHeight: 4 }} title={String(v)} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "#6B5B4E" }}>30 days ago</span>
                  <span style={{ fontSize: "0.72rem", color: "#6B5B4E" }}>Today</span>
                </div>
              </div>
            ))}

            {/* Summary cards */}
            {[["Total Revenue", "GH₵ 48,200", "#8FA853"], ["Avg Job Value", "GH₵ 320", "#FEC868"], ["Completion Rate", "87%", "#ABC270"], ["Dispute Rate", "2.1%", "#FDA769"]].map(([label, val, color]) => (
              <div key={label as string} className="boafo-card" style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "0.8rem", color: "#6B5B4E", marginBottom: "0.375rem" }}>{label as string}</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: color as string }}>{val as string}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

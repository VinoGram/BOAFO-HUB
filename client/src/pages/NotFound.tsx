import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#FFF8EE,#FDE8CB)",
      fontFamily: "'Inter',sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: "1.5rem",
        border: "1.5px solid #E8D9BF",
        padding: "3rem 2.5rem", textAlign: "center",
        maxWidth: 440, width: "100%", margin: "1rem",
        boxShadow: "0 8px 40px rgba(71,60,51,0.1)",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(253,167,105,0.12)",
          border: "2px dashed #FDA769",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          fontSize: "2rem", color: "#FDA769",
        }}>?</div>

        <h1 style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "3.5rem", color: "#473C33", marginBottom: "0.25rem" }}>404</h1>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#473C33", marginBottom: "0.75rem" }}>Page Not Found</h2>
        <p style={{ color: "#6B5B4E", lineHeight: 1.7, marginBottom: "2rem" }}>
          The page you're looking for doesn't exist.<br />It may have been moved or removed.
        </p>
        <button onClick={() => navigate("/")} className="btn-boafo btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.9375rem" }}>
          Back to BOAFO
        </button>
      </div>
    </div>
  );
}

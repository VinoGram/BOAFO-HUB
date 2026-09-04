import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";
import { User, Mail, Phone, MapPin, Globe, Briefcase, Camera, Save, ArrowLeft } from "lucide-react";

const NEO_BG = "#EEE8DF";
const neo = (raised = true): React.CSSProperties => ({
  background: NEO_BG,
  borderRadius: "1rem",
  boxShadow: raised
    ? "6px 6px 14px #d4cec6, -6px -6px 14px #ffffff"
    : "inset 4px 4px 10px #d4cec6, inset -4px -4px 10px #ffffff",
  border: "none",
});

function NeoInput({ icon, ...props }: any) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#8A7A6E", display: "flex" }}>
        {icon}
      </span>
      <input
        {...props}
        style={{
          ...neo(false),
          width: "100%", padding: "0.75rem 0.875rem 0.75rem 2.5rem",
          fontSize: "0.9rem", color: "#473C33", outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : user?.profilePictureUrl ?? "", [file, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(""); setSuccess(false);
    try {
      const fd = new FormData();
      if (name) fd.append("name", name);
      if (email) fd.append("email", email);
      if (phone) fd.append("phone", phone);
      if (bio) fd.append("bio", bio);
      if (location) fd.append("location", location);
      if (company) fd.append("company", company);
      if (website) fd.append("website", website);
      if (file) fd.append("file", file);
      await profileApi.updateMe(fd);
      await refresh();
      setSuccess(true); setMessage("Profile updated successfully.");
    } catch (err: any) {
      setSuccess(false); setMessage(err.message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: NEO_BG, fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: NEO_BG, borderBottom: "1px solid #D8D0C6", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(71,60,51,0.08)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <button onClick={() => window.history.back()} style={{ ...neo(), background: "none", boxShadow: "none", border: "none", color: "#ABC270", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#473C33", marginBottom: "0.25rem" }}>My Profile</h1>
        <p style={{ color: "#8A7A6E", fontSize: "0.875rem", marginBottom: "2rem" }}>Update your personal information</p>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{ position: "relative" }}>
            <div style={{ ...neo(), width: 100, height: 100, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "8px 8px 18px #d4cec6, -8px -8px 18px #ffffff" }}>
              {previewUrl
                ? <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={40} color="#8A7A6E" />}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: "50%", background: "#ABC270", border: "3px solid " + NEO_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "2px 2px 6px rgba(0,0,0,0.15)" }}>
              <Camera size={14} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ ...neo(), padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Personal Info</p>
            <NeoInput icon={<User size={15} />} placeholder="Full name" value={name} onChange={(e: any) => setName(e.target.value)} />
            <NeoInput icon={<Mail size={15} />} type="email" placeholder="Email address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            <NeoInput icon={<Phone size={15} />} type="tel" placeholder="Phone number" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
          </div>

          <div style={{ ...neo(), padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8A7A6E", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>About</p>
            <div style={{ position: "relative" }}>
              <textarea
                placeholder="Short bio…"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                style={{ ...neo(false), width: "100%", padding: "0.75rem 0.875rem", fontSize: "0.9rem", color: "#473C33", outline: "none", resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <NeoInput icon={<MapPin size={15} />} placeholder="Location" value={location} onChange={(e: any) => setLocation(e.target.value)} />
            <NeoInput icon={<Briefcase size={15} />} placeholder="Company / specialty" value={company} onChange={(e: any) => setCompany(e.target.value)} />
            <NeoInput icon={<Globe size={15} />} placeholder="Website" value={website} onChange={(e: any) => setWebsite(e.target.value)} />
          </div>

          {message && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: success ? "rgba(171,194,112,0.15)" : "rgba(224,90,58,0.1)", border: `1px solid ${success ? "#ABC270" : "#E05A3A"}`, color: success ? "#8FA853" : "#C0392B", fontSize: "0.875rem", fontWeight: 500 }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...neo(), padding: "0.875rem", background: loading ? "#C8D9A0" : "#ABC270", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: loading ? "none" : "4px 4px 10px #d4cec6, -2px -2px 8px #ffffff" }}>
            <Save size={16} /> {loading ? "Saving…" : "Save Profile"}
          </button>
        </form>

        {/* View public profile link */}
        {user?.id && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href={`/user/${user.id}`} style={{ fontSize: "0.85rem", color: "#ABC270", fontWeight: 600, textDecoration: "none" }}>
              View my public profile →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

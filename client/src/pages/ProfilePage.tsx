import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";

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

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : user?.profilePictureUrl ?? ""), [file, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (email) formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (bio) formData.append("bio", bio);
      if (location) formData.append("location", location);
      if (company) formData.append("company", company);
      if (website) formData.append("website", website);
      if (file) formData.append("file", file);
      await profileApi.updateMe(formData);
      await refresh();
      setMessage("Profile updated successfully.");
    } catch (error: any) {
      setMessage(error.message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>My Profile</h1>
      <form onSubmit={handleSave} style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {previewUrl ? <img src={previewUrl} alt="Profile" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#f2e6d0" }} />}
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={4} style={{ padding: "0.75rem", borderRadius: 8 }} />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company / specialty" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" style={{ padding: "0.75rem", borderRadius: 8 }} />
        <button type="submit" disabled={loading} style={{ padding: "0.8rem 1.2rem", borderRadius: 8, background: "#ABC270", color: "#fff", border: "none" }}>
          {loading ? "Saving..." : "Save profile"}
        </button>
        {message ? <p>{message}</p> : null}
      </form>
    </div>
  );
}

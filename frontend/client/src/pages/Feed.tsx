import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageCircle, Image, X, ChevronDown, ChevronUp,
  Trash2, Send, MapPin, Info, Clock,
} from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#ABC270", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function CommentSection({ postId, user }: { postId: number; user: any }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["feed-comments", postId],
    queryFn: () => feedApi.getComments(postId),
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: (content: string) => feedApi.addComment(postId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed-comments", postId] });
      setText("");
    },
  });

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(trimmed);
  };

  return (
    <div style={{ borderTop: "1px solid #F0E8D8", marginTop: "0.75rem", paddingTop: "0.75rem" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", color: "#6B5B4E", fontSize: "0.82rem", fontWeight: 600, padding: 0 }}
      >
        <MessageCircle size={15} />
        Comments
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div style={{ marginTop: "0.75rem" }}>
          {isLoading && <p style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.5rem" }}>Loading…</p>}

          {(comments as any[]).map((c: any) => (
            <div key={c.id} style={{ display: "flex", gap: "0.625rem", marginBottom: "0.625rem", alignItems: "flex-start" }}>
              <Avatar name={c.authorName} url={c.authorAvatar} size={28} />
              <div style={{ background: "#F5EDD8", borderRadius: "0.75rem", padding: "0.5rem 0.75rem", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#473C33" }}>{c.authorName}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", color: "#999" }}>
                    <Clock size={10} />{timeAgo(c.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#473C33", margin: 0 }}>{c.content}</p>
              </div>
            </div>
          ))}

          {(comments as any[]).length === 0 && !isLoading && (
            <p style={{ fontSize: "0.8rem", color: "#999", marginBottom: "0.625rem" }}>No comments yet.</p>
          )}

          {user ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Avatar name={user.name} url={user.profilePictureUrl} size={28} />
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submit(); }}
                placeholder="Write a comment…"
                style={{ flex: 1, border: "1.5px solid #E8D9BF", borderRadius: 9999, padding: "0.4rem 0.875rem", fontSize: "0.82rem", outline: "none", background: "#FAFAF8", fontFamily: "inherit" }}
              />
              <button
                onClick={submit}
                disabled={!text.trim() || addComment.isPending}
                style={{ background: "#ABC270", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: !text.trim() ? 0.4 : 1 }}
              >
                <Send size={13} color="#fff" />
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "0.8rem", color: "#999" }}>
              <a href="/login" style={{ color: "#ABC270", fontWeight: 600 }}>Sign in</a> to comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, user, onDelete }: { post: any; user: any; onDelete: (id: number) => void }) {
  const [imgIdx, setImgIdx] = useState<number | null>(null);
  const isOwner = user && String(user.id) === String(post.authorId);

  return (
    <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1.5px solid #E8D9BF", padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.875rem" }}>
        <Avatar name={post.authorName} url={post.authorAvatar} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "#473C33", fontSize: "0.9rem" }}>{post.authorName}</span>
            <span style={{ fontSize: "0.7rem", background: "rgba(171,194,112,0.15)", color: "#8FA853", borderRadius: 9999, padding: "1px 8px", fontWeight: 600 }}>
              {post.authorRole === "customer" ? "Client" : post.authorRole}
            </span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#999" }}>
            <Clock size={11} />{timeAgo(post.createdAt)}
          </span>
        </div>
        {isOwner && (
          <button onClick={() => onDelete(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", padding: 4 }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Content */}
      <p style={{ color: "#473C33", lineHeight: 1.65, fontSize: "0.9rem", marginBottom: post.imageUrls?.length ? "0.875rem" : 0 }}>{post.content}</p>

      {/* Images */}
      {post.imageUrls?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: post.imageUrls.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: "0.375rem", borderRadius: "0.875rem", overflow: "hidden", marginBottom: "0.5rem" }}>
          {post.imageUrls.slice(0, 4).map((url: string, i: number) => (
            <div key={i} style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setImgIdx(i)}>
              <img src={url} alt="" style={{ width: "100%", height: post.imageUrls.length === 1 ? 320 : 180, objectFit: "cover", display: "block" }} />
              {i === 3 && post.imageUrls.length > 4 && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
                  +{post.imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CommentSection postId={post.id} user={user} />

      {/* Lightbox */}
      {imgIdx !== null && (
        <div onClick={() => setImgIdx(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={post.imageUrls[imgIdx]} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "0.75rem" }} />
        </div>
      )}
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: posts = [], isLoading } = useQuery({ queryKey: ["feed"], queryFn: () => feedApi.list(30) });

  const createPost = useMutation({
    mutationFn: (fd: FormData) => feedApi.create(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); setContent(""); setImages([]); setPreviews([]); },
  });

  const deletePost = useMutation({
    mutationFn: (id: number) => feedApi.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const handlePost = () => {
    if (!content.trim()) return;
    const fd = new FormData();
    fd.append("content", content.trim());
    images.forEach(img => fd.append("images", img));
    createPost.mutate(fd);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8EE", fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: "rgba(255,248,238,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8D9BF", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: "1rem" }}>
          <a href="/" style={{ fontFamily: "'Moonwalk','Inter',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#473C33", textDecoration: "none" }}>BOAFO</a>
          <div style={{ flex: 1 }} />
          <a href="/search" className="nav-link" style={{ fontSize: "0.875rem" }}>Browse Jobs</a>
          {user?.role === "customer" && <a href="/dashboard/customer" className="nav-link" style={{ fontSize: "0.875rem" }}>Dashboard</a>}
          {user?.role === "provider" && <a href="/dashboard/provider" className="nav-link" style={{ fontSize: "0.875rem" }}>Dashboard</a>}
        </div>
      </nav>

      <div className="container" style={{ padding: "2rem 1.25rem", maxWidth: 680 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#473C33", marginBottom: "1.5rem" }}>Community Feed</h1>

        {/* Compose — customers only */}
        {user?.role === "customer" && (
          <div style={{ background: "#fff", borderRadius: "1.25rem", border: "1.5px solid #E8D9BF", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <Avatar name={user.name} url={user.profilePictureUrl} />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share an update, tip, or question with the community…"
                rows={3}
                style={{ flex: 1, border: "1.5px solid #E8D9BF", borderRadius: "0.875rem", padding: "0.75rem", fontSize: "0.9rem", resize: "none", outline: "none", background: "#FAFAF8", fontFamily: "inherit" }}
              />
            </div>

            {previews.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={src} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "0.625rem", border: "1.5px solid #E8D9BF" }} />
                    <button type="button" onClick={() => { setImages(imgs => imgs.filter((_, j) => j !== i)); setPreviews(ps => ps.filter((_, j) => j !== i)); }}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#E05A3A", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.875rem" }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "1.5px solid #E8D9BF", borderRadius: 9999, padding: "0.35rem 0.875rem", cursor: "pointer", fontSize: "0.8rem", color: "#6B5B4E", fontWeight: 600 }}>
                <Image size={14} /> Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, 5);
                  setImages(files);
                  setPreviews(files.map(f => URL.createObjectURL(f)));
                }} />
              <button onClick={handlePost} disabled={!content.trim() || createPost.isPending}
                className="btn-boafo btn-primary" style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}>
                {createPost.isPending ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        )}

        {user && user.role !== "customer" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", background: "rgba(171,194,112,0.08)", border: "1.5px solid rgba(171,194,112,0.3)", borderRadius: "0.875rem", padding: "0.875rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#6B5B4E" }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: "#8FA853" }} />
            Only clients can post here. You can comment on any post.
          </div>
        )}

        {isLoading ? (
          <p style={{ color: "#6B5B4E", textAlign: "center", padding: "3rem" }}>Loading feed…</p>
        ) : (posts as any[]).length === 0 ? (
          <p style={{ color: "#6B5B4E", textAlign: "center", padding: "3rem" }}>No posts yet. Be the first to share!</p>
        ) : (
          (posts as any[]).map((p: any) => (
            <PostCard key={p.id} post={p} user={user} onDelete={id => deletePost.mutate(id)} />
          ))
        )}
      </div>
    </div>
  );
}

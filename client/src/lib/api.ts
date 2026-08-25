const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = body instanceof FormData ? undefined : body ? { "Content-Type": "application/json" } : undefined;
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

const get  = <T>(path: string)                   => request<T>("GET",    path);
const post = <T>(path: string, body?: unknown)   => request<T>("POST",   path, body);
const patch= <T>(path: string, body?: unknown)   => request<T>("PATCH",  path, body);
const del  = <T>(path: string)                   => request<T>("DELETE", path);

function qs(params: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  me:         () => get<any>("/auth/me"),
  logout:     () => post<any>("/auth/logout"),
  sendOtp:    (phone: string) => post<any>("/auth/otp/send", { phone }),
  verifyOtp: (phone: string, otp: string, userInfo?: { name?: string; role?: string; plan?: string; districts?: string[] }) =>
    post<any>("/auth/otp/verify", { phone, otp, ...userInfo }),
  login:      (email: string, password: string) => post<any>("/auth/login", { email, password }),
  register:   (data: object) => post<any>("/auth/register", data),
  passwordForgot: (email: string) => post<any>("/auth/password/forgot", { email }),
  passwordReset: (data: { email: string; otp: string; newPassword: string; confirmPassword: string }) =>
    post<any>("/auth/password/reset", data),
};


// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list:    () => get<any[]>("/categories"),
  getById: (id: number) => get<any>(`/categories/${id}`),
};

// ── Providers ─────────────────────────────────────────────────────────────────
export const providersApi = {
  search:          (params: object) => get<any[]>(`/providers/search${qs(params as Record<string,unknown>)}`),
  listVerified:    (limit = 20, offset = 0) => get<any[]>(`/providers/verified${qs({ limit, offset })}`),
  getById:         (id: number) => get<any>(`/providers/${id}`),
  getProfile:      () => get<any>("/providers/me"),
  getSpecializations: (id: number) => get<any[]>(`/providers/${id}/specializations`),
  getPortfolio:    (id: number) => get<any[]>(`/providers/${id}/portfolio`),
  getMyPortfolio:  () => get<any[]>("/providers/me/portfolio"),
  uploadPortfolioItem: (formData: FormData) => post<any>("/providers/me/portfolio", formData),
  deletePortfolioItem: (itemId: number) => del<any>(`/providers/me/portfolio/${itemId}`),
  getReviews:      (id: number) => get<any[]>(`/providers/${id}/reviews`),
  createProfile:   (data: object) => post<any>("/providers", data),
  updateProfile:   (data: object) => patch<any>("/providers/me", data),
  getEarnings:     () => get<any[]>("/providers/me/earnings"),
  getTotalEarnings:() => get<any>("/providers/me/earnings/total"),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersApi = {
  getProfile:    () => get<any>("/customers/me"),
  createProfile: (data: object) => post<any>("/customers", data),
};

export const profileApi = {
  getMe: () => get<any>("/profile/me"),
  updateMe: (formData: FormData) => {
    return fetch(`${BASE}/profile/me`, {
      method: "PATCH",
      credentials: "include",
      body: formData,
    }).then(async (res) => {
      const text = await res.text();
      if (!res.ok) {
        const err = text ? JSON.parse(text) : { detail: res.statusText };
        throw new Error(err.detail ?? res.statusText);
      }
      return text ? JSON.parse(text) : null;
    });
  },
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list:       (limit = 20, offset = 0) => get<any[]>(`/jobs${qs({ limit, offset })}`),
  search:     (params: object) => get<any[]>(`/jobs/search${qs(params as Record<string,unknown>)}`),
  getById:    (id: number) => get<any>(`/jobs/${id}`),
  getByCustomer: () => get<any[]>("/jobs/mine"),
  getByCategory: (tradeCategoryId: number, limit = 20, offset = 0) =>
                  get<any[]>(`/jobs/by-category${qs({ tradeCategoryId, limit, offset })}`),
  create:     (data: object) => post<any>("/jobs", data),
  getBids:    (jobId: number) => get<any[]>(`/jobs/${jobId}/bids`),
  placeBid:   (jobId: number, data: object) => post<any>(`/jobs/${jobId}/bids`, data),
  acceptBid:  (jobId: number, bidId: number) => post<any>(`/jobs/${jobId}/bids/${bidId}/accept`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  getById:     (id: number) => get<any>(`/bookings/${id}`),
  getByProvider: () => get<any[]>("/bookings/mine/provider"),
  getByCustomer: () => get<any[]>("/bookings/mine/customer"),
  create:      (data: object) => post<any>("/bookings", data),
  accept:      (id: number) => post<any>(`/bookings/${id}/accept`),
  decline:     (id: number, reason?: string) => post<any>(`/bookings/${id}/decline`, { reason }),
  complete:    (id: number) => post<any>(`/bookings/${id}/complete`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getByProvider: (providerId: number) => get<any[]>(`/reviews/provider/${providerId}`),
  create:        (data: object) => post<any>("/reviews", data),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getMessages: (bookingId: number) => get<any[]>(`/chat/${bookingId}/messages`),
  sendMessage: (data: { bookingId: number; content: string }) => post<any>("/chat/messages", data),
  sendVoiceNote: (data: FormData) => post<any>("/chat/voice-notes", data),
  deleteMessage: (messageId: number) => del<any>(`/chat/messages/${messageId}`),
  markAsRead:  (messageId: number) => post<any>(`/chat/messages/${messageId}/read`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:       (limit = 50, offset = 0) => get<any[]>(`/notifications${qs({ limit, offset })}`),
  getUnread:  () => get<any[]>("/notifications/unread"),
  markAsRead: (id: number) => post<any>(`/notifications/${id}/read`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getByBooking: (bookingId: number) => get<any>(`/payments/booking/${bookingId}`),
  getByProvider: () => get<any[]>("/payments/mine"),
  createIntent: (data: object) => post<any>("/payments/intent", data),
  confirm:      (data: object) => post<any>("/payments/confirm", data),
};

// ── Matching ──────────────────────────────────────────────────────────────────
export const matchingApi = {
  smartMatch:      (jobId: number) => get<any[]>(`/matching/smart-match${qs({ jobId })}`),
  searchJobs:      (params: object) => get<any[]>(`/matching/search-jobs${qs(params as Record<string,unknown>)}`),
  searchProviders: (params: object) => get<any[]>(`/matching/search-providers${qs(params as Record<string,unknown>)}`),
  getJobDetail:    (jobId: number) => get<any>(`/matching/job-detail/${jobId}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  upload:    (data: { documentType: string; fileBase64: string; fileName: string; mimeType?: string }) =>
               post<any>("/documents", data),
  getMine:   () => get<any[]>("/documents/mine"),
  getByProvider: (providerId: number) => get<any[]>(`/documents/provider/${providerId}`),
  approve:   (docId: number) => post<any>(`/documents/${docId}/approve`),
  reject:    (docId: number) => post<any>(`/documents/${docId}/reject`),
};

// ── Availability ──────────────────────────────────────────────────────────────
export const availabilityApi = {
  getMine:          () => get<any[]>("/availability/mine"),
  getByProvider:    (providerId: number) => get<any[]>(`/availability/provider/${providerId}`),
  set:              (data: object) => post<any>("/availability", data),
  delete:           (slotId: number) => del<any>(`/availability/${slotId}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  create:  (data: object) => post<any>("/reports", data),
  list:    () => get<any[]>("/reports"),
  resolve: (id: number) => post<any>(`/reports/${id}/resolve`),
};

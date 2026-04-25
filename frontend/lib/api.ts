const API_BASE_URL = "http://127.0.0.1:8000";

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getAuthHeadersMultipart(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type for multipart — browser sets boundary automatically
  return headers;
}

/**
 * Create an AbortController with a timeout.
 * Prevents fetch from hanging indefinitely if the server is unreachable.
 */
function createTimeoutSignal(ms: number = REQUEST_TIMEOUT_MS): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      throw new ApiError("Unauthorized access", 401);
    }
    
    let message = "Something went wrong";
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {
      // Response wasn't JSON
    }

    throw new ApiError(message, response.status);
  }
  
  const data = await response.json();
  console.log("✅ RESPONSE:", data);
  return data;
}

// ──────────────────────────────────────────────
// Auth APIs
// ──────────────────────────────────────────────

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  is_admin?: boolean;
}) {
  const endpoint = "/auth/signup";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, is_admin: data.is_admin ?? false }),
      signal: createTimeoutSignal(),
    });
    // Backend returns AuthResponse: { access_token, token_type, user_id, email, is_admin }
    return handleResponse<{ access_token: string; token_type: string; user_id: string; email: string; is_admin: boolean }>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("⏱️ TIMEOUT: Signup request timed out");
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

export async function login(data: { email: string; password: string }) {
  const endpoint = "/auth/login";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: createTimeoutSignal(),
    });
    // Backend returns: { access_token, token_type, user_id, email, is_admin }
    // Frontend expects: { access_token, user: { id, name, email, is_admin } }
    const raw = await handleResponse<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      is_admin: boolean;
    }>(response);

    // Map to what login page expects
    return {
      access_token: raw.access_token,
      user: {
        id: raw.user_id,
        name: raw.email.split("@")[0], // Backend doesn't return name in login response; derive from email
        email: raw.email,
        is_admin: raw.is_admin,
      } as User,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("⏱️ TIMEOUT: Login request timed out");
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

// ──────────────────────────────────────────────
// Prediction API
// ──────────────────────────────────────────────

export async function predictWaste(image: File) {
  const endpoint = "/predict";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const formData = new FormData();
    formData.append("file", image);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeadersMultipart(),
      body: formData,
      signal: createTimeoutSignal(30000), // 30s — TF model inference can take a moment
    });
    return handleResponse<PredictionResult>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

// ──────────────────────────────────────────────
// Posts APIs
// ──────────────────────────────────────────────

export async function createPost(data: {
  before_image: File;
  after_image: File;
  waste_type: string;
  recycled: boolean;
}) {
  const endpoint = "/posts/create";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const formData = new FormData();
    formData.append("before_image", data.before_image);
    formData.append("after_image", data.after_image);
    formData.append("waste_type", data.waste_type);
    formData.append("recycled", String(data.recycled));
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeadersMultipart(),
      body: formData,
      signal: createTimeoutSignal(15000), // longer timeout for file upload
    });
    return handleResponse<{ message: string; post_id: string }>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

export async function getPosts() {
  const endpoint = "/posts";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    const raw = await handleResponse<Array<{
      id: string;
      user_id: string;
      before_image_path: string;
      after_image_path: string;
      waste_type: string;
      recycled: boolean;
      timestamp: string;
    }>>(response);

    // Map backend response to frontend Post shape
    return raw.map((post): Post => ({
      id: post.id,
      before_image: post.before_image_path,
      after_image: post.after_image_path,
      waste_type: post.waste_type,
      recycled: post.recycled,
      created_at: post.timestamp,
      user: {
        id: post.user_id,
        name: `User ${post.user_id.slice(-4)}`,
        email: "",
      },
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

// ──────────────────────────────────────────────
// User Stats API
// ──────────────────────────────────────────────

export async function getUserStats() {
  const endpoint = "/user/stats";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    // Backend returns: { total_posts, total_points, total_co2_saved }
    // Frontend UserStats expects: { total_posts, points, co2_saved }
    const raw = await handleResponse<{
      total_posts: number;
      total_points: number;
      total_co2_saved: number;
    }>(response);

    return {
      total_posts: raw.total_posts,
      points: raw.total_points,
      co2_saved: raw.total_co2_saved,
    } as UserStats;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

// ──────────────────────────────────────────────
// Admin APIs
// ──────────────────────────────────────────────

export async function getAdminUsersCount() {
  const endpoint = "/admin/users-count";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    // Backend returns: { users_count: number }
    // Frontend admin dashboard reads: res.count
    const raw = await handleResponse<{ users_count: number }>(response);
    return { count: raw.users_count };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

export async function getAdminCO2Saved() {
  const endpoint = "/admin/co2-saved";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    // Backend returns: { total_co2_saved: number }
    // Frontend admin dashboard reads: res.co2_saved
    const raw = await handleResponse<{ total_co2_saved: number }>(response);
    return { co2_saved: raw.total_co2_saved };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

export async function getAdminActivity() {
  const endpoint = "/admin/activity";
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    // Backend returns: { total_posts: number, recent_posts: number }
    const raw = await handleResponse<{ total_posts: number; recent_posts: number }>(response);

    return {
      total_posts: raw.total_posts,
      recent_activity: [] as Array<{
        id: string;
        action: string;
        timestamp: string;
        user: string;
      }>,
    } as AdminActivity;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

export async function deletePost(postId: string) {
  const endpoint = `/admin/post/${postId}`;
  console.log("➡️ API CALL:", endpoint);
  console.log("➡️ FULL URL:", API_BASE_URL + endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      signal: createTimeoutSignal(),
    });
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Server timeout — please try again", 0);
    }
    console.error("❌ NETWORK ERROR:", error);
    throw new ApiError("Server not reachable", 0);
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface PredictionResult {
  filename?: string;
  waste_type: string;
  confidence: number;         // 0.0 – 1.0 (from model softmax output)
  recyclable: boolean;
  disposal_instructions?: string;
  ideas?: string[];
  map_location?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}

export interface Post {
  id: string;
  before_image: string;
  after_image: string;
  waste_type: string;
  recycled: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UserStats {
  total_posts: number;
  points: number;
  co2_saved: number;
}

export interface AdminActivity {
  total_posts: number;
  recent_activity: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

// Helper for auth context
export const api = {
  auth: {
    getToken,
  },
};


import axios from "axios";
import { mockHandlers, handleMockAction } from "./mockData";

const normalizeBaseUrl = (value) => {
  if (!value) return "";
  const v = String(value).trim().replace(/\/+$/, "");
  if (!v) return "";

  if (!/^https?:\/\//i.test(v)) {
    const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(v);
    if (isLocalhost) {
      return `http://${v}`;
    }
    return `https://${v}`;
  }

  return v;
};

const withApiPrefix = (base) => {
  if (!base) return "";
  const v = String(base).trim().replace(/\/+$/, "");
  if (!v) return "";
  // Avoid double-appending /api or /api/
  return /\/api\/?$/i.test(v) ? v : `${v}/api`;
};

const getSameOriginApiBase = () => {
  const basePath = String(import.meta.env.BASE_URL || "/").trim();
  const normalizedBase = basePath === "/" ? "" : `/${basePath.replace(/^\/+|\/+$/g, "")}`;
  return `${normalizedBase}/api`;
};

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_DEMO_MODE === true;

export const getDemoLoginResponse = () => {
  const role = localStorage.getItem("demo_role") || "admin";
  return {
    token: "demo_token_12345",
    role: role,
    name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    userId: "demo_user_id"
  };
};

const API = axios.create({
  baseURL: (() => {
    const envBase = normalizeBaseUrl(import.meta.env.VITE_API_URL);
    if (envBase) return withApiPrefix(envBase);
    return getSameOriginApiBase();
  })(),
});

const normalizeDemoPath = (url, baseURL, params) => {
  let path = url || "/";
  if (baseURL && path.startsWith(baseURL)) {
    path = path.replace(baseURL, "");
  }
  path = path.replace(/^\/api/, "") || "/";
  if (!path.startsWith("/")) path = "/" + path;

  const query = params ? new URLSearchParams(params).toString() : "";
  const fullPath = query ? `${path}?${query}` : path;

  const basePath = path.split("?")[0].replace(/\/$/, "") || "/";

  return { fullPath, basePath };
};

// Demo Mode Interceptor
if (isDemoMode) {
  API.interceptors.request.use((config) => {
    const { fullPath, basePath } = normalizeDemoPath(
      config.url,
      config.baseURL,
      config.params
    );

    const getHandler = () => {
      if (mockHandlers[fullPath]) return mockHandlers[fullPath];
      if (mockHandlers[basePath]) return mockHandlers[basePath];
      if (mockHandlers[`${basePath}/`]) return mockHandlers[`${basePath}/`];
      return null;
    };

    const handler = getHandler();

    if (handler && config.method.toLowerCase() === "get") {
      console.log(`[Demo Mode] Intercepting GET ${fullPath}`);
      config.adapter = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(handler()), 400);
        });
      };
    } else if (config.method.toLowerCase() !== "get") {
      console.log(`[Demo Mode] Simulating ${config.method} ${config.url}`);
      config.adapter = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(handleMockAction(config)), 400);
        });
      };
    } else if (!handler) {
      console.warn(`[Demo Mode] No mock handler for ${fullPath}`);
    }

    return config;
  });
}

// attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === "Network Error" && !isDemoMode) {
      console.error("NETWORK ERROR DIAGNOSTICS:", error);
    }
    return Promise.reject(error);
  }
);

export default API;

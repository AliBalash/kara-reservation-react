const DEFAULT_API_BASE = import.meta.env.PROD
  ? "/api/public/reservations"
  : "https://127.0.0.1:18001/api/public/reservations";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, errors = {}, payload = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.toLowerCase().includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => null) : null;

  if (response.redirected) {
    throw new ApiError("درخواست به آدرس دیگری منتقل شد. لطفا تنظیمات API را بررسی کنید.", {
      status: response.status,
      payload,
    });
  }

  if (!response.ok) {
    const errorBag = payload?.errors && typeof payload.errors === "object" ? payload.errors : {};
    const firstField = Object.keys(errorBag)[0];
    const message =
      payload?.message ||
      payload?.error ||
      errorBag?.[firstField]?.[0] ||
      "API request failed.";
    throw new ApiError(message, {
      status: response.status,
      errors: errorBag,
      payload,
    });
  }

  if (!isJsonResponse || payload === null || typeof payload !== "object") {
    throw new ApiError("پاسخ دریافت‌شده از API معتبر نیست.", {
      status: response.status,
      payload,
    });
  }

  return payload?.data ?? payload;
}

export function isValidationApiError(error) {
  return error instanceof ApiError && error.status === 422;
}

export function fetchBootstrap(signal) {
  return request("/bootstrap", { signal });
}

export function fetchBrands(signal) {
  return request("/brands", { signal });
}

export function fetchModels(brand, signal) {
  const query = brand ? `?brand=${encodeURIComponent(brand)}` : "";
  return request(`/models${query}`, { signal });
}

export function fetchCars({ modelId, brand, pickupDate, returnDate }, signal) {
  const params = new URLSearchParams();
  if (modelId) {
    params.set("model_id", modelId);
  }
  if (brand) {
    params.set("brand", brand);
  }

  if (pickupDate && returnDate) {
    params.set("pickup_date", pickupDate);
    params.set("return_date", returnDate);
  }

  const query = params.toString();
  return request(`/cars${query ? `?${query}` : ""}`, { signal });
}

export function fetchQuote(body, signal) {
  return request("/quote", { method: "POST", body, signal });
}

export function createReservation(body, signal) {
  return request("/submit", { method: "POST", body, signal });
}

export { API_BASE };

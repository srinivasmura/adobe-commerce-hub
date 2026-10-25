
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Common function to send requests to the backend API
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `Request failed: ${response.status}`
    );
  }

  return response.json();
}

// Product API methods
export const productService = {
  // Get all products
  getAll: () => request("/api/products"),

  // Add a new product
  create: (product) =>
    request("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),

  // Update an existing product
  update: (id, product) =>
    request(`/api/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),

  // Delete a product
  remove: (id) =>
    request(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

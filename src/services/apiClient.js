const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiClient(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include', // si usas cookies / auth
    ...options
  });

  const json = await res.json();

  // 🔥 Tu estándar backend
  if (!json.success) {
    const error = new Error(json.message || 'Error');
    error.code = res.status;
    error.details = json.error;
    throw error;
  }

  return json.data;
}

export default apiClient;

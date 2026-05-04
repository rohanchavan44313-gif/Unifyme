const API_BASE = "https://unifyme-1.onrender.com";

async function request(method, path, body) {
  const res = await fetch(API_BASE + "/api" + path, {
    method,
    credentials: "include", // 🔥 REQUIRED
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
export async function apiStart(payload) {
  return request("/api/start", { method: "POST", body: JSON.stringify(payload) });
}

export async function apiAction(sessionId, action) {
  return request("/api/action", {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: JSON.stringify({ action }),
  });
}

export async function apiPolymorphism(sessionId, targetId) {
  return request("/api/polymorphism", {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: JSON.stringify({ targetId: normalizeTargetId(targetId) }),
  });
}

export async function apiClassPolymorphism(sessionId, className) {
  return request("/api/polymorphism", {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: JSON.stringify({ className }),
  });
}

export async function apiSelect(sessionId, courseName, selectedIndex) {
  return request("/api/select", {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: JSON.stringify({ courseName, selectedIndex }),
  });
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return response.json();
}

function normalizeTargetId(targetId) {
  return targetId.replace(/^object:/, "");
}

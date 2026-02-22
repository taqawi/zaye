const apiBase =
  window.API_BASE ||
  (window.location.port === "5173" ? "http://127.0.0.1:8080/api" : "/api");
const mediaBase = apiBase.startsWith("http") ? apiBase.replace(/\/api\/?$/, "") : window.location.origin;

const toastDialog = document.getElementById("toast-dialog");
const toastContainer = document.getElementById("toast-container");
const authDialog = document.getElementById("auth-dialog");
const chatDialog = document.getElementById("chat-dialog");
const chatMessagesEl = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

let activeListing = null;
let activeThreadId = null;
let chatSocket = null;
let cachedMeId = null;
let slideIndex = 0;
let slideImages = [];

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${mediaBase}${url}`;
  return `${mediaBase}/${url}`;
}

function showToast(message, type = "info") {
  if (!toastContainer) return;
  if (toastDialog && !toastDialog.open) {
    toastDialog.show();
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
  setTimeout(() => {
    if (toastDialog && toastContainer.childElementCount === 0) {
      toastDialog.close();
    }
  }, 4000);
}

function getAccessToken() {
  return localStorage.getItem("access") || "";
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function ensureAuth() {
  if (getAccessToken()) return true;
  authDialog.showModal();
  return false;
}

async function login(e) {
  e.preventDefault();
  const phone = document.getElementById("auth-phone").value.trim();
  const password = document.getElementById("auth-password").value;
  const res = await fetch(`${apiBase}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) {
    showToast("ورود ناموفق بود.", "error");
    return;
  }
  const data = await res.json();
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  authDialog.close();
  showToast("ورود انجام شد.", "success");
}

function renderSlider() {
  const imageEl = document.getElementById("slide-image");
  const dots = document.getElementById("slide-dots");
  if (!slideImages.length) {
    imageEl.src = "";
    dots.innerHTML = "";
    return;
  }
  imageEl.src = resolveMediaUrl(slideImages[slideIndex]);
  dots.innerHTML = "";
  slideImages.forEach((_, idx) => {
    const dot = document.createElement("span");
    dot.className = `slide-dot ${idx === slideIndex ? "active" : ""}`;
    dot.addEventListener("click", () => {
      slideIndex = idx;
      renderSlider();
    });
    dots.appendChild(dot);
  });
}

async function fetchListing() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  const res = await fetch(`${apiBase}/listings/${id}/`);
  if (!res.ok) {
    showToast("آگهی پیدا نشد.", "error");
    return;
  }
  const data = await res.json();
  activeListing = data;
  document.getElementById("detail-title").textContent = data.title;
  document.getElementById("detail-heading").textContent = data.title;
  document.getElementById("detail-meta").textContent = `${data.province}، ${data.city}`;
  const price = data.price_unit === "negotiable" ? "قیمت توافقی" : `${Number(data.price_value).toLocaleString("fa-IR")} تومان`;
  document.getElementById("detail-price").textContent = price;
  document.getElementById("detail-description").textContent = data.description || "توضیحی ثبت نشده است.";
  slideImages = (data.images || []).map((img) => img.image);
  slideIndex = 0;
  renderSlider();
}

async function showContact() {
  if (!activeListing) return;
  const res = await fetch(`${apiBase}/listings/${activeListing.id}/contact/`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    showToast("برای مشاهده اطلاعات تماس باید وارد شوید.", "error");
    return;
  }
  const data = await res.json();
  showToast(`تلفن همراه: ${data.phone} | ایمیل: ${data.email || "-"} | تلفن ثابت: ${data.landline || "-"}`);
}

async function getMeId() {
  if (cachedMeId) return cachedMeId;
  const res = await fetch(`${apiBase}/auth/me/`, { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  cachedMeId = data.id;
  return cachedMeId;
}

async function openChat() {
  if (!activeListing) return;
  const ok = await ensureAuth();
  if (!ok) return;
  const res = await fetch(`${apiBase}/chat/threads/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ other_user_id: activeListing.owner.id }),
  });
  if (!res.ok) {
    showToast("امکان شروع چت نیست.", "error");
    return;
  }
  const thread = await res.json();
  activeThreadId = thread.id;
  await loadMessages();
  openChatSocket();
  chatDialog.showModal();
}

async function loadMessages() {
  if (!activeThreadId) return;
  const res = await fetch(`${apiBase}/chat/threads/${activeThreadId}/messages/`, {
    headers: authHeaders(),
  });
  if (!res.ok) return;
  const data = await res.json();
  chatMessagesEl.innerHTML = "";
  const me = await getMeId();
  data.forEach((msg) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${msg.sender.id === me ? "me" : "other"}`;
    bubble.textContent = msg.text;
    if (msg.created_at) {
      const time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = new Date(msg.created_at).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      bubble.appendChild(time);
    }
    chatMessagesEl.appendChild(bubble);
  });
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function sendMessage(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !activeThreadId) return;
  chatInput.value = "";
  if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
    chatSocket.send(JSON.stringify({ text }));
  } else {
    const res = await fetch(`${apiBase}/chat/threads/${activeThreadId}/messages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      showToast("ارسال پیام ناموفق بود.", "error");
      return;
    }
    await loadMessages();
  }
}

function openChatSocket() {
  if (!activeThreadId) return;
  if (chatSocket) {
    chatSocket.close();
  }
  const token = getAccessToken();
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = apiBase.startsWith("http") ? new URL(apiBase).host : window.location.host;
  chatSocket = new WebSocket(`${proto}://${host}/ws/chat/${activeThreadId}/?token=${token}`);
  chatSocket.onmessage = async (event) => {
    const payload = JSON.parse(event.data);
    if (!payload) return;
    const me = await getMeId();
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${payload.sender_id === me ? "me" : "other"}`;
    bubble.textContent = payload.text;
    if (payload.created_at) {
      const time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = new Date(payload.created_at).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      bubble.appendChild(time);
    }
    chatMessagesEl.appendChild(bubble);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  };
}

document.getElementById("slide-prev").addEventListener("click", () => {
  if (!slideImages.length) return;
  slideIndex = (slideIndex - 1 + slideImages.length) % slideImages.length;
  renderSlider();
});

document.getElementById("slide-next").addEventListener("click", () => {
  if (!slideImages.length) return;
  slideIndex = (slideIndex + 1) % slideImages.length;
  renderSlider();
});

document.getElementById("detail-contact").addEventListener("click", showContact);
document.getElementById("detail-chat").addEventListener("click", openChat);

chatForm.addEventListener("submit", sendMessage);
document.getElementById("chat-close").addEventListener("click", () => chatDialog.close());

document.getElementById("auth-form").addEventListener("submit", login);
document.getElementById("auth-close").addEventListener("click", () => authDialog.close());
document.getElementById("auth-cancel").addEventListener("click", () => authDialog.close());

[authDialog, chatDialog].forEach((dlg) => {
  dlg.addEventListener("click", (event) => {
    if (event.target === dlg) {
      dlg.close();
    }
  });
});

fetchListing();

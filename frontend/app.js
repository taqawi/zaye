const apiBase =
  window.API_BASE ||
  (window.location.port === "5173" ? "http://127.0.0.1:8080/api" : "/api");
const listEl = document.getElementById("listings");
const listCount = document.getElementById("list-count");
const template = document.getElementById("listing-card");
const dialog = document.getElementById("listing-dialog");
const createDialog = document.getElementById("create-dialog");
const authDialog = document.getElementById("auth-dialog");
const categoryDialog = document.getElementById("category-dialog");
const categoryList = document.getElementById("category-list");
const categoryPathEl = document.getElementById("category-path");
const categoryBack = document.getElementById("category-back");
const chatDialog = document.getElementById("chat-dialog");
const dialogs = [dialog, authDialog, createDialog, categoryDialog, chatDialog];
const toastDialog = document.getElementById("toast-dialog");
const toastContainer = document.getElementById("toast-container");
const imagePreview = document.getElementById("image-preview");
const chatMessagesEl = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
let activeListing = null;
let orderedImages = [];
let activeThreadId = null;
let chatSocket = null;

const mediaBase = apiBase.startsWith("http")
  ? apiBase.replace(/\/api\/?$/, "")
  : window.location.origin;

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${mediaBase}${url}`;
  return `${mediaBase}/${url}`;
}

const fields = [
  "q",
  "type",
  "province",
  "city",
  "min_price",
  "max_price",
  "min_weight",
  "max_weight",
];

const categoryState = {
  level: 1,
  level1: null,
  level2: null,
};

function buildQuery() {
  const params = new URLSearchParams();
  fields.forEach((field) => {
    const value = document.getElementById(field).value.trim();
    if (value) {
      params.append(field, value);
    }
  });
  return params.toString();
}

function formatPrice(item) {
  if (item.price_unit === "negotiable") return "قیمت توافقی";
  const value = item.price_value ? Number(item.price_value).toLocaleString("fa-IR") : "-";
  return `${value} تومان`;
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

function renderListings(items) {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const clone = template.content.cloneNode(true);
    const thumb = clone.querySelector(".thumb");
    if (thumb && item.images && item.images.length) {
      thumb.src = resolveMediaUrl(item.images[0].image);
      thumb.alt = item.title;
    }
    clone.querySelector(".title").textContent = item.title;
    clone.querySelector(".meta").textContent = `${item.province}، ${item.city} • ${item.type === "buy" ? "خرید" : "فروش"}`;
    clone.querySelector(".price").textContent = formatPrice(item);
    clone.querySelector(".view").addEventListener("click", () => {
      window.location.href = `/listing.html?id=${item.id}`;
    });
    listEl.appendChild(clone);
  });
  listCount.textContent = `${items.length} مورد`;
}

async function fetchListings() {
  listCount.textContent = "در حال بارگذاری...";
  const query = buildQuery();
  const res = await fetch(`${apiBase}/listings/${query ? `?${query}` : ""}`);
  if (!res.ok) {
    listCount.textContent = "خطا در دریافت آگهی‌ها";
    showToast("خطا در دریافت آگهی‌ها", "error");
    return;
  }
  const data = await res.json();
  renderListings(data);
}

function getAccessToken() {
  return localStorage.getItem("access") || "";
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function openDialog(item) {
  activeListing = item;
  document.getElementById("dialog-title").textContent = item.title;
  document.getElementById("dialog-meta").textContent = `${item.province}، ${item.city} • وزن: ${item.weight_value} ${item.weight_unit}`;
  document.getElementById("dialog-price").textContent = formatPrice(item);
  document.getElementById("dialog-description").textContent = item.description || "توضیحی ثبت نشده است.";
  dialog.showModal();
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

function renderCategoryList(items, onClick, showChevron) {
  categoryList.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-item";
    const chevronVisible = showChevron && item.has_children;
    button.innerHTML = `
      <span>${item.name}</span>
      ${chevronVisible ? "<span class=\"chevron\">›</span>" : ""}
    `;
    button.addEventListener("click", () => onClick(item));
    li.appendChild(button);
    categoryList.appendChild(li);
  });
}

function updateCategoryPath() {
  const parts = [categoryState.level1?.name, categoryState.level2?.name].filter(Boolean);
  categoryPathEl.textContent = parts.length ? parts.join(" / ") : "انتخاب دسته‌بندی";
}

function updateCategoryBack() {
  categoryBack.disabled = categoryState.level === 1;
}

async function showLevel1() {
  categoryState.level = 1;
  categoryState.level1 = null;
  categoryState.level2 = null;
  const res = await fetch(`${apiBase}/categories/level1/`);
  const data = await res.json();
  renderCategoryList(data, handleLevel1Click, true);
  updateCategoryPath();
  updateCategoryBack();
}

async function handleLevel1Click(item) {
  categoryState.level1 = item;
  categoryState.level2 = null;
  if (!item.has_children) {
    showToast("این دسته زیرشاخه‌ای ندارد.");
    return;
  }
  const res = await fetch(`${apiBase}/categories/level2/?parent=${item.id}`);
  const data = await res.json();
  categoryState.level = 2;
  renderCategoryList(data, handleLevel2Click, true);
  updateCategoryPath();
  updateCategoryBack();
}

async function handleLevel2Click(item) {
  categoryState.level2 = item;
  if (!item.has_children) {
    selectCategory(item, null);
    return;
  }
  const res = await fetch(`${apiBase}/categories/level3/?parent=${item.id}`);
  const data = await res.json();
  if (!data.length) {
    selectCategory(item, null);
    return;
  }
  categoryState.level = 3;
  renderCategoryList(data, (level3) => selectCategory(item, level3), false);
  updateCategoryPath();
  updateCategoryBack();
}

function selectCategory(level2, level3) {
  const level2Id = level2?.id || "";
  const level3Id = level3?.id || "";
  document.getElementById("category-level2-id").value = level2Id;
  document.getElementById("category-level3-id").value = level3Id;

  const parts = [categoryState.level1?.name, level2?.name, level3?.name].filter(Boolean);
  document.getElementById("category-display").value = parts.join(" / ");
  categoryDialog.close();
}

async function openCreateDialog() {
  const ok = await ensureAuth();
  if (!ok) return;
  createDialog.showModal();
}

async function submitListing(e) {
  e.preventDefault();
  const priceUnit = document.getElementById("create-price-unit").value;
  const priceValueInput = document.getElementById("create-price").value.trim();
  const level2Id = Number(document.getElementById("category-level2-id").value || 0);
  const level3IdRaw = document.getElementById("category-level3-id").value;
  const level3Id = level3IdRaw ? Number(level3IdRaw) : null;
  const images = orderedImages;

  if (!level2Id) {
    showToast("لطفاً دسته‌بندی را انتخاب کنید.", "error");
    return;
  }

  const payload = {
    type: document.getElementById("create-type").value,
    title: document.getElementById("create-title").value.trim(),
    category_level2_id: level2Id,
    category_level3_id: level3Id,
    weight_value: Number(document.getElementById("create-weight").value),
    weight_unit: document.getElementById("create-weight-unit").value,
    price_unit: priceUnit,
    price_value: priceUnit === "negotiable" ? null : Number(priceValueInput),
    province: document.getElementById("create-province").value.trim(),
    city: document.getElementById("create-city").value.trim(),
    description: document.getElementById("create-description").value.trim(),
  };

  if (priceUnit !== "negotiable" && !priceValueInput) {
    showToast("قیمت را وارد کنید یا واحد قیمت را توافقی قرار دهید.", "error");
    return;
  }

  const res = await fetch(`${apiBase}/listings/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    authDialog.showModal();
    return;
  }
  if (!res.ok) {
    showToast("ثبت آگهی ناموفق بود.", "error");
    return;
  }
  const created = await res.json();
  if (images.length) {
    for (let i = 0; i < images.length; i += 1) {
      const formData = new FormData();
      formData.append("image", images[i]);
      formData.append("sort_order", String(i));
      const uploadRes = await fetch(`${apiBase}/listings/${created.id}/images/`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      });
      if (!uploadRes.ok) {
        showToast("آگهی ثبت شد، اما آپلود بعضی تصاویر ناموفق بود.", "error");
        break;
      }
    }
  }
  createDialog.close();
  await fetchListings();
  showToast("آگهی ثبت شد و منتظر تایید ادمین است.", "success");
}

function renderImagePreview() {
  imagePreview.innerHTML = "";
  orderedImages.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.draggable = true;
    item.dataset.index = String(index);
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const actions = document.createElement("div");
    actions.className = "preview-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.addEventListener("click", () => moveImage(index, -1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.addEventListener("click", () => moveImage(index, 1));
    actions.appendChild(up);
    actions.appendChild(down);
    item.appendChild(img);
    item.appendChild(actions);
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", item.dataset.index);
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer.getData("text/plain"));
      const to = Number(item.dataset.index);
      if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
      const copy = [...orderedImages];
      const moved = copy.splice(from, 1)[0];
      copy.splice(to, 0, moved);
      orderedImages = copy;
      renderImagePreview();
    });
    imagePreview.appendChild(item);
  });
}

function moveImage(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= orderedImages.length) return;
  const copy = [...orderedImages];
  const temp = copy[index];
  copy[index] = copy[newIndex];
  copy[newIndex] = temp;
  orderedImages = copy;
  renderImagePreview();
}

function handleImageSelection(e) {
  const files = Array.from(e.target.files || []);
  orderedImages = files;
  renderImagePreview();
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

let cachedMeId = null;
async function getMeId() {
  if (cachedMeId) return cachedMeId;
  const res = await fetch(`${apiBase}/auth/me/`, { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  cachedMeId = data.id;
  return cachedMeId;
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

function bindEvents() {
  document.getElementById("search").addEventListener("click", fetchListings);
  document.getElementById("reset").addEventListener("click", () => {
    fields.forEach((field) => (document.getElementById(field).value = ""));
    fetchListings();
  });
  document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
  document.getElementById("contact").addEventListener("click", showContact);
  document.getElementById("chat").addEventListener("click", openChat);

  document.getElementById("cta-new").addEventListener("click", openCreateDialog);
  const navCreate = document.getElementById("nav-create");
  if (navCreate) {
    navCreate.addEventListener("click", openCreateDialog);
  }
  document.getElementById("create-close").addEventListener("click", () => createDialog.close());
  document.getElementById("create-cancel").addEventListener("click", () => createDialog.close());
  document.getElementById("create-form").addEventListener("submit", submitListing);
  document.getElementById("create-images").addEventListener("change", handleImageSelection);
  document.getElementById("create-price-unit").addEventListener("change", (e) => {
    const priceInput = document.getElementById("create-price");
    const isNegotiable = e.target.value === "negotiable";
    priceInput.disabled = isNegotiable;
    if (isNegotiable) priceInput.value = "";
  });

  document.getElementById("category-open").addEventListener("click", () => {
    showLevel1();
    categoryDialog.showModal();
  });
  document.getElementById("category-close").addEventListener("click", () => categoryDialog.close());
  categoryBack.addEventListener("click", () => {
    if (categoryState.level === 3) {
      handleLevel1Click(categoryState.level1);
      return;
    }
    if (categoryState.level === 2) {
      showLevel1();
    }
  });

  document.getElementById("auth-form").addEventListener("submit", login);
  document.getElementById("auth-close").addEventListener("click", () => authDialog.close());
  document.getElementById("auth-cancel").addEventListener("click", () => authDialog.close());

  document.getElementById("chat-close").addEventListener("click", () => chatDialog.close());
  chatForm.addEventListener("submit", sendMessage);

  dialogs.forEach((dlg) => {
    dlg.addEventListener("click", (event) => {
      if (event.target === dlg) {
        dlg.close();
      }
    });
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

bindEvents();
fetchListings();

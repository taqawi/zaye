"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBase, resolveMediaUrl } from "../../../lib/api";
import { ToastDialog, useToasts } from "../../../components/toast";

export default function ListingPage({ params }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const { toasts, show } = useToasts();
  const [listing, setListing] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);
  const [meId, setMeId] = useState(null);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  async function fetchListing() {
    const res = await fetch(`${apiBase}/listings/${params.id}/`);
    if (!res.ok) {
      show("آگهی پیدا نشد.", "error");
      return;
    }
    const data = await res.json();
    setListing(data);
    setSlideIndex(0);
  }

  function ensureAuth() {
    if (localStorage.getItem("access")) return true;
    setAuthOpen(true);
    return false;
  }

  async function login(e) {
    e.preventDefault();
    const phone = e.currentTarget.elements["auth-phone"].value.trim();
    const password = e.currentTarget.elements["auth-password"].value;
    const res = await fetch(`${apiBase}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      show("ورود ناموفق بود.", "error");
      return;
    }
    const data = await res.json();
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAuthOpen(false);
    show("ورود انجام شد.", "success");
  }

  async function showContact() {
    const res = await fetch(`${apiBase}/listings/${listing.id}/contact/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });
    if (!res.ok) {
      show("برای مشاهده اطلاعات تماس باید وارد شوید.", "error");
      return;
    }
    const data = await res.json();
    show(`تلفن همراه: ${data.phone} | ایمیل: ${data.email || "-"} | تلفن ثابت: ${data.landline || "-"}`);
  }

  async function getMeId() {
    if (meId) return meId;
    const res = await fetch(`${apiBase}/auth/me/`, { headers: { Authorization: `Bearer ${localStorage.getItem("access")}` } });
    if (!res.ok) return null;
    const data = await res.json();
    setMeId(data.id);
    return data.id;
  }

  async function openChat() {
    if (!ensureAuth()) return;
    const res = await fetch(`${apiBase}/chat/threads/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access")}` },
      body: JSON.stringify({ other_user_id: listing.owner.id, listing_id: listing.id }),
    });
    if (!res.ok) {
      show("امکان شروع چت نیست.", "error");
      return;
    }
    const thread = await res.json();
    setThreadId(thread.id);
    await loadMessages(thread.id);
    openChatSocket(thread.id);
    setChatOpen(true);
  }

  async function addBookmark() {
    if (!ensureAuth()) return;
    const res = await fetch(`${apiBase}/listings/bookmarks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access")}` },
      body: JSON.stringify({ listing_id: listing.id }),
    });
    if (!res.ok) {
      show("نشان کردن ناموفق بود.", "error");
      return;
    }
    show("به نشان‌ها اضافه شد.", "success");
  }

  async function shareListing() {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const title = listing.title || "آگهی";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // ignore cancel
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      show("لینک کپی شد.", "success");
      return;
    }
    show(url, "success");
  }

  async function loadMessages(id) {
    const res = await fetch(`${apiBase}/chat/threads/${id}/messages/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setChatMessages(data);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !threadId) return;
    setChatInput("");
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({ text }));
      return;
    }
    const res = await fetch(`${apiBase}/chat/threads/${threadId}/messages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access")}` },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      show("ارسال پیام ناموفق بود.", "error");
      return;
    }
    await loadMessages(threadId);
  }

  function openChatSocket(id) {
    if (chatSocket) chatSocket.close();
    const token = localStorage.getItem("access");
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = apiBase.startsWith("http") ? new URL(apiBase).host : window.location.host;
    const socket = new WebSocket(`${proto}://${host}/ws/chat/${id}/?token=${token}`);
    socket.onmessage = async (event) => {
      const payload = JSON.parse(event.data);
      const currentMe = await getMeId();
      setChatMessages((prev) => [...prev, { sender: { id: payload.sender_id }, text: payload.text, created_at: payload.created_at, _me: payload.sender_id === currentMe }]);
    };
    setChatSocket(socket);
  }

  if (!listing) {
    return (
      <div className="app">
        <ToastDialog toasts={toasts} />
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  const images = listing.images || [];
  const activeImage = images[slideIndex] ? resolveMediaUrl(images[slideIndex].image) : "";

  return (
    <div className="app divar-app listing-desktop">
      <ToastDialog toasts={toasts} />
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center">
          <div className="search-bar">
            <input placeholder="جستجو در همه آگهی‌ها" />
            <button className="secondary" type="button">جستجو</button>
          </div>
          <div className="topbar-filters">
            <div className="topbar-select">
              <span>دسته‌ها</span>
              <button className="link" type="button">انتخاب</button>
            </div>
            <div className="topbar-select">
              <span>شهر</span>
              <button className="link" type="button">{listing.city || "قم"}</button>
            </div>
          </div>
        </div>
        <div className="topbar-left">
          <button className="primary" type="button">ثبت آگهی</button>
          <button className="link" type="button">دیوار من</button>
          <button className="link" type="button">چت و تماس</button>
          <button className="link" type="button">پشتیبانی</button>
        </div>
      </header>

      <div className="listing-shell">
        <section className="listing-gallery">
          <div className="gallery-main">
            <button className="secondary" type="button" onClick={() => setSlideIndex((slideIndex - 1 + images.length) % images.length)}>‹</button>
            <img src={activeImage} alt={listing.title} />
            <button className="secondary" type="button" onClick={() => setSlideIndex((slideIndex + 1) % images.length)}>›</button>
          </div>
          <div className="gallery-thumbs">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                className={`thumb-btn ${idx === slideIndex ? "active" : ""}`}
                type="button"
                onClick={() => setSlideIndex(idx)}
              >
                <img src={resolveMediaUrl(img.image)} alt="" />
              </button>
            ))}
          </div>
          <div className="note-box">
            <textarea placeholder="یادداشت شما..." rows={4}></textarea>
            <p>یادداشت تنها برای خودتان قابل نمایش است و پس از حذف آگهی پاک خواهد شد.</p>
          </div>
        </section>

        <aside className="listing-info">
          <div className="breadcrumb">کالای دیجیتال › صوتی و تصویری › تلویزیون و پروژکتور</div>
          <h1>{listing.title}</h1>
          <div className="listing-meta">{listing.city} • لحظاتی پیش</div>
          <div className="listing-warning">زنگ خطرهای قبل از معامله</div>
          <div className="listing-actions">
            <button className="secondary" type="button" onClick={addBookmark}>نشان کردن</button>
            <button className="secondary" type="button" onClick={shareListing}>اشتراک‌گذاری</button>
            <button className="secondary" type="button" onClick={openChat}>چت</button>
            <button className="primary" type="button" onClick={showContact}>اطلاعات تماس</button>
          </div>
          <div className="specs">
            <div className="spec-row"><span>نوع کالا</span><span>تلویزیون</span></div>
            <div className="spec-row"><span>سازنده</span><span>LG</span></div>
            <div className="spec-row"><span>وضعیت</span><span>کارکرده</span></div>
            <div className="spec-row"><span>قیمت</span><span>{listing.price_unit === "negotiable" ? "توافقی" : `${Number(listing.price_value || 0).toLocaleString("fa-IR")} تومان`}</span></div>
          </div>
          <div className="desc">
            <h3>توضیحات</h3>
            <p>{listing.description || "توضیحی ثبت نشده است."}</p>
          </div>
        </aside>
      </div>

      <div className="listing-mobile">
          <div className="mobile-hero">
            <div className="mobile-hero-top">
              <div className="mobile-actions">
                <button className="icon-btn" type="button" onClick={shareListing}>⇪</button>
                <button className="icon-btn" type="button" onClick={addBookmark}>🔖</button>
                <button className="icon-btn" type="button">⋯</button>
              </div>
              <button className="icon-btn" type="button">→</button>
            </div>
          <div className="mobile-hero-image">
            <button className="icon-btn" type="button">‹</button>
            <img src={activeImage} alt={listing.title} />
            <button className="icon-btn" type="button">›</button>
            <span className="badge">10</span>
          </div>
        </div>

        <div className="mobile-content">
          <div className="breadcrumb">کالای دیجیتال › صوتی و تصویری › تلویزیون و پروژکتور</div>
          <h1>{listing.title}</h1>
          <div className="listing-meta">{listing.city} • لحظاتی پیش</div>
          <div className="listing-warning">زنگ خطرهای قبل از معامله</div>
          <div className="specs">
            <div className="spec-row"><span>نوع کالا</span><span>تلویزیون</span></div>
            <div className="spec-row"><span>سازنده</span><span>LG</span></div>
            <div className="spec-row"><span>وضعیت</span><span>کارکرده</span></div>
            <div className="spec-row"><span>قیمت</span><span>{listing.price_unit === "negotiable" ? "توافقی" : `${Number(listing.price_value || 0).toLocaleString("fa-IR")} تومان`}</span></div>
          </div>
          <div className="desc">
            <h3>توضیحات</h3>
            <p>{listing.description || "توضیحی ثبت نشده است."}</p>
          </div>
        </div>

        <div className="mobile-cta">
          <button className="primary" type="button" onClick={showContact}>اطلاعات تماس</button>
          <button className="primary" type="button" onClick={openChat}>چت</button>
        </div>
      </div>

      <dialog open={authOpen} onClick={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
        <div className="dialog-content">
          <header>
            <h3>ورود</h3>
            <button onClick={() => setAuthOpen(false)}>✕</button>
          </header>
          <form id="auth-form" className="form-grid" onSubmit={login}>
            <div className="field">
              <label>شماره تلفن</label>
              <input name="auth-phone" type="tel" placeholder="09xxxxxxxxx" required />
            </div>
            <div className="field">
              <label>رمز عبور</label>
              <input name="auth-password" type="password" required />
            </div>
            <div className="actions">
              <button className="secondary" type="button" onClick={() => setAuthOpen(false)}>انصراف</button>
              <button className="primary" type="submit">ورود</button>
            </div>
          </form>
        </div>
      </dialog>

      <dialog open={chatOpen} onClick={(e) => e.target === e.currentTarget && setChatOpen(false)}>
        <div className="dialog-content">
          <header>
            <h3>چت</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </header>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender.id === meId || msg._me ? "me" : "other"}`}>
                {msg.text}
                {msg.created_at && (
                  <span className="chat-time">
                    {new Date(msg.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="پیام خود را بنویسید..." />
            <button className="primary" type="submit">ارسال</button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

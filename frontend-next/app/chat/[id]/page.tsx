"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getApiBase, resolveMediaUrl } from "../../lib/api";
import { ToastDialog, useToasts } from "../../components/toast";

function formatUserName(user) {
  if (!user) return "کاربر";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || "کاربر";
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatThreadPage({ params }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const { toasts, show } = useToasts();
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setAuthMissing(true);
      setLoading(false);
      return;
    }
    initialize(token);
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [params.id, apiBase]);

  async function initialize(token) {
    setLoading(true);
    await Promise.all([fetchThread(token), fetchMessages(token), fetchMe(token)]);
    openSocket(token);
    setLoading(false);
  }

  async function fetchThread(token) {
    const res = await fetch(`${apiBase}/chat/threads/${params.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      show("خطا در دریافت گفتگو.", "error");
      return;
    }
    const data = await res.json();
    setThread(data);
  }

  async function fetchMessages(token) {
    const res = await fetch(`${apiBase}/chat/threads/${params.id}/messages/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data);
  }

  async function fetchMe(token) {
    if (meId) return meId;
    const res = await fetch(`${apiBase}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    setMeId(data.id);
    return data.id;
  }

  function openSocket(token) {
    if (socketRef.current) {
      socketRef.current.close();
    }
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = apiBase.startsWith("http") ? new URL(apiBase).host : window.location.host;
    const socket = new WebSocket(`${proto}://${host}/ws/chat/${params.id}/?token=${token}`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          id: payload.message_id,
          text: payload.text,
          file: payload.file,
          created_at: payload.created_at,
          sender: { id: payload.sender_id },
        },
      ]);
    };
    socketRef.current = socket;
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ text }));
      return;
    }
    const token = localStorage.getItem("access");
    if (!token) {
      show("برای ارسال پیام وارد شوید.", "error");
      return;
    }
    const res = await fetch(`${apiBase}/chat/threads/${params.id}/messages/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      show("ارسال پیام ناموفق بود.", "error");
      return;
    }
    const data = await res.json();
    setMessages((prev) => [...prev, data]);
  }

  async function sendFile(file) {
    const token = localStorage.getItem("access");
    if (!token) {
      show("برای ارسال فایل وارد شوید.", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${apiBase}/chat/threads/${params.id}/messages/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      show("ارسال فایل ناموفق بود.", "error");
      return;
    }
    const data = await res.json();
    setMessages((prev) => [...prev, data]);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    sendFile(file);
    e.target.value = "";
  }

  function isImage(fileUrl) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileUrl || "");
  }

  const imageUrl = thread?.listing?.images?.[0]?.image
    ? resolveMediaUrl(thread.listing.images[0].image)
    : "/assets/icon-192.png";

  return (
    <div className="app divar-app chat-thread">
      <ToastDialog toasts={toasts} />
      {loading && <div className="chat-row">در حال بارگذاری...</div>}
      {!loading && authMissing && (
        <div className="chat-row">برای مشاهده گفتگو وارد شوید.</div>
      )}
      {!loading && !authMissing && (
        <>
          <header className="chat-header">
            <button className="icon-btn">⋯</button>
            <div className="chat-header-title">
              <div>~ {formatUserName(thread?.other_user)}</div>
              <span>آخرین بروزرسانی {formatTime(thread?.updated_at)}</span>
            </div>
            <Link className="icon-btn" href="/chat">→</Link>
          </header>

          <div className="chat-ad">
            <img src={imageUrl} alt="" />
            <div>
              <div className="chat-ad-title">{thread?.listing?.title || "آگهی"}</div>
              <div className="chat-ad-sub">آگهی</div>
            </div>
          </div>

          <div className="chat-notice">
            طبق قوانین، سامانه موظف است محتوای چت را تا ۶ ماه نگه‌داری کند.
            لطفاً از ارسال اطلاعات شخصی و نامربوط به معامله خودداری کنید.
          </div>

          <div className="chat-messages thread">
            {messages.map((msg, index) => {
              const isMe = msg.sender?.id === meId || msg._me;
              return (
                <div key={msg.id || msg.created_at || index} className={`chat-bubble ${isMe ? "me" : "other"}`}>
                  {msg.text}
                  {msg.file && isImage(msg.file) && (
                    <img className="chat-attachment" src={resolveMediaUrl(msg.file)} alt="attachment" />
                  )}
                  {msg.file && !isImage(msg.file) && (
                    <a className="chat-attachment-link" href={resolveMediaUrl(msg.file)} target="_blank" rel="noreferrer">
                      فایل ضمیمه
                    </a>
                  )}
                  <span className="chat-time">{formatTime(msg.created_at)}</span>
                </div>
              );
            })}
          </div>

          <form className="chat-tools" onSubmit={sendMessage}>
            <button className="tool-btn" type="button" onClick={() => fileInputRef.current?.click()}>📎</button>
            <input
              placeholder="متنی بنویسید"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="tool-btn" type="button">🎤</button>
            <button className="tool-main" type="button" onClick={() => setToolsOpen(!toolsOpen)}>ابزارها</button>
          </form>
          <input ref={fileInputRef} type="file" className="sr-only" onChange={handleFileChange} />

          {toolsOpen && (
            <div className="chat-tools-popover">
              <button type="button">عکس از گالری</button>
              <button type="button">شماره موبایل</button>
              <button type="button">موقعیت از روی نقشه</button>
            </div>
          )}

          <nav className="bottom-nav" aria-label="navigation">
            <Link className="nav-item" href="/">آگهی‌ها</Link>
            <Link className="nav-item active" href="/chat">چت و تماس</Link>
            <Link className="nav-item primary-nav" href="/post">
              <span className="nav-icon plus">+</span>
            </Link>
            <Link className="nav-item" href="/bookmarks">نشان‌ها</Link>
            <Link className="nav-item" href="/my">دیوار من</Link>
          </nav>
        </>
      )}
    </div>
  );
}

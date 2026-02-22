"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBase, resolveMediaUrl } from "../lib/api";
import { ToastDialog, useToasts } from "../components/toast";

function formatUserName(user) {
  if (!user) return "کاربر";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || "کاربر";
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

export default function ChatListPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const { toasts, show } = useToasts();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }
    fetchThreads(token);
  }, [apiBase]);

  async function fetchThreads(token) {
    setLoading(true);
    const res = await fetch(`${apiBase}/chat/threads/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      show("خطا در دریافت گفتگوها.", "error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setThreads(data);
    setLoading(false);
  }

  return (
    <div className="app divar-app chat-desktop chat-page">
      <ToastDialog toasts={toasts} />
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="primary" href="/post">ثبت آگهی</Link>
          <button className="link" type="button">دیوار من</button>
          <button className="link" type="button">چت و تماس</button>
          <button className="link" type="button">پشتیبانی</button>
        </div>
      </header>

      <div className="chat-desktop-shell">
        <aside className="chat-desktop-list">
          <div className="chat-tabs">
            <button className="active">چت</button>
            <button>تماس ناشناس</button>
          </div>
          <div className="chat-chips">
            {["دستیار فروش", "خوانده‌نشده", "آگهی‌های من"].map((chip) => (
              <button key={chip} className="chip" type="button">{chip}</button>
            ))}
          </div>

          <div className="chat-list">
            {loading && (
              <div className="chat-row">
                <div className="chat-body">در حال بارگذاری...</div>
              </div>
            )}
            {!loading && !hasToken && (
              <div className="chat-row">
                <div className="chat-body">برای مشاهده چت‌ها وارد شوید.</div>
              </div>
            )}
            {!loading && hasToken && threads.length === 0 && (
              <div className="chat-row">
                <div className="chat-body">گفتگویی وجود ندارد.</div>
              </div>
            )}
            {threads.map((thread) => {
              const title = thread.listing?.title || `گفتگو با ${formatUserName(thread.other_user)}`;
              const subtitle = thread.last_message?.text || "پیامی وجود ندارد.";
              const imageUrl = thread.listing?.images?.[0]?.image
                ? resolveMediaUrl(thread.listing.images[0].image)
                : "/assets/icon-192.png";
              const time = formatTime(thread.last_message?.created_at || thread.updated_at);
              return (
                <Link key={thread.id} href={`/chat/${thread.id}`} className="chat-row">
                  <div className="chat-thumb">
                    <img src={imageUrl} alt="" />
                  </div>
                  <div className="chat-body">
                    <div className="chat-title">{title}</div>
                    <div className="chat-sub">{subtitle}</div>
                  </div>
                  <div className="chat-meta">
                    <span>{time}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="chat-desktop-thread">
          <div className="chat-header">
            <button className="icon-btn">⋯</button>
            <div className="chat-header-title">
              <div>گفتگوها</div>
              <span>برای شروع، یکی از گفتگوها را انتخاب کنید.</span>
            </div>
            <button className="icon-btn">→</button>
          </div>

          <div className="chat-notice">
            برای مشاهده پیام‌ها روی یکی از گفتگوهای سمت راست کلیک کنید.
          </div>
        </main>
      </div>
    </div>
  );
}

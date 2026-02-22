"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getApiBase, resolveMediaUrl } from "../../lib/api";
import { ToastDialog, useToasts } from "../../components/toast";

export default function BookmarksPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const { toasts, show } = useToasts();
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState("ads");
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  async function fetchSaved() {
    const token = localStorage.getItem("access");
    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }
    const res = await fetch(`${apiBase}/listings/bookmarks/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      show("خطا در دریافت نشان‌ها", "error");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBookmarks(data);
    setLoading(false);
  }

  async function removeBookmark(bookmarkId) {
    const token = localStorage.getItem("access");
    if (!token) {
      show("ابتدا وارد شوید.", "error");
      return;
    }
    const res = await fetch(`${apiBase}/listings/bookmarks/${bookmarkId}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      show("حذف ناموفق بود.", "error");
      return;
    }
    setBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));
    show("حذف شد.", "success");
  }

  async function shareListing(listing) {
    if (!listing) return;
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

  return (
    <div className="app divar-app bookmarks-page">
      <ToastDialog toasts={toasts} />
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/">بازگشت</Link>
        </div>
      </header>

      <div className="bookmark-tabs">
        <button className={activeTab === "ads" ? "active" : ""} onClick={() => setActiveTab("ads")}>آگهی‌ها و یادداشت‌ها</button>
        <button className={activeTab === "search" ? "active" : ""} onClick={() => setActiveTab("search")}>جستجوها</button>
      </div>

      <div className="bookmark-list">
        {loading && <div className="bookmark-card">در حال بارگذاری...</div>}
        {!loading && !hasToken && <div className="bookmark-card">برای مشاهده نشان‌ها وارد شوید.</div>}
        {!loading && hasToken && bookmarks.length === 0 && <div className="bookmark-card">نشان ثبت نشده است.</div>}
        {bookmarks.map((item) => {
          const listing = item.listing;
          return (
            <div key={item.id} className="bookmark-card">
              <img src={listing?.images?.[0]?.image ? resolveMediaUrl(listing.images[0].image) : ""} alt="" />
              <div className="bookmark-body">
                <h3>{listing?.title || "آگهی"}</h3>
                <p>{listing?.price_unit === "negotiable" ? "قیمت توافقی" : `${Number(listing?.price_value || 0).toLocaleString("fa-IR")} تومان`}</p>
                <span>{listing?.city || ""}</span>
              </div>
              <div className="bookmark-actions">
                <button className="secondary" type="button" onClick={() => removeBookmark(item.id)}>حذف</button>
                <button className="secondary" type="button" onClick={() => shareListing(listing)}>اشتراک‌گذاری</button>
              </div>
            </div>
          );
        })}
      </div>

      <nav className="bottom-nav" aria-label="navigation">
        <Link className="nav-item" href="/">آگهی‌ها</Link>
        <Link className="nav-item" href="/chat">چت و تماس</Link>
        <Link className="nav-item primary-nav" href="/post">
          <span className="nav-icon plus">+</span>
        </Link>
        <Link className="nav-item active" href="/bookmarks">نشان‌ها</Link>
        <Link className="nav-item" href="/my">دیوار من</Link>
      </nav>
    </div>
  );
}

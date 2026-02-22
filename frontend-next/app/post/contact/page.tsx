"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostContactPage() {
  const [phoneVisible, setPhoneVisible] = useState(true);
  const [useOwnNumber, setUseOwnNumber] = useState(true);
  const [anonCall, setAnonCall] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);

  return (
    <div className="app divar-app post-page">
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/post/details">بازگشت</Link>
        </div>
      </header>

      <main className="post-container">
        <div className="post-card">
          <div className="post-header">
            <div>
              <div className="post-step">ثبت آگهی</div>
              <h2>راه‌های تماس آگهی‌دهنده با شما <span className="required">*</span></h2>
            </div>
            <button className="secondary" type="button">پاک کردن</button>
          </div>

          <div className="post-section">
            <label className="checkbox-row large">
              <input type="checkbox" checked={phoneVisible} onChange={(e) => setPhoneVisible(e.target.checked)} />
              تماس تلفنی
            </label>
            <div className="radio-group">
              <label className="radio-row">
                <input type="radio" name="phone" checked={useOwnNumber} onChange={() => { setUseOwnNumber(true); setAnonCall(false); }} />
                تماس با شماره 09127500188
              </label>
              <label className="radio-row">
                <input type="radio" name="phone" checked={anonCall} onChange={() => { setAnonCall(true); setUseOwnNumber(false); }} />
                تماس ناشناس از شماره واسط
              </label>
            </div>
          </div>

          <div className="post-section">
            <label className="checkbox-row large">
              <input type="checkbox" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />
              پیام در چت دیوار
            </label>
          </div>

          <button className="primary post-next" type="button">ثبت اطلاعات</button>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastDialog, useToasts } from "../../components/toast";

export default function PostStepOne() {
  const router = useRouter();
  const { toasts, show } = useToasts();
  const [images, setImages] = useState([]);
  const [type, setType] = useState("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImages((prev) => {
      const merged = [...prev, ...files];
      if (merged.length > 10) {
        show("حداکثر ۱۰ عکس قابل انتخاب است.", "error");
      }
      return merged.slice(0, 10);
    });
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function goNext() {
    localStorage.setItem(
      "post_step1",
      JSON.stringify({
        type,
        title,
        description,
      }),
    );
    router.push("/post/category");
  }

  return (
    <div className="app divar-app post-page">
      <ToastDialog toasts={toasts} />
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/">بازگشت</Link>
          <button className="link" type="button">پشتیبانی</button>
        </div>
      </header>

      <main className="post-container">
        <div className="post-card">
          <div className="post-header">
            <h2>ثبت آگهی</h2>
            <button className="secondary" type="button" onClick={() => { setImages([]); setTitle(""); setDescription(""); }}>
              پاک کردن
            </button>
          </div>

          <div className="post-section">
            <label className="post-label">عکس آگهی <span className="required">*</span></label>
            <div className="post-images">
              {images.map((file, idx) => (
                <div key={file.name + idx} className="post-image-item">
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                  <button className="image-remove" type="button" onClick={() => removeImage(idx)}>أ—</button>
                </div>
              ))}
              <label className="post-image-upload">
                <input type="file" accept="image/*" multiple onChange={handleImages} />
                <span>+</span>
              </label>
            </div>
            <p className="post-help">تعداد عکس‌های انتخاب‌شده نباید بیشتر از ۱۰ باشد.</p>
          </div>

          <div className="post-section">
            <label className="post-label">نوع آگهی <span className="required">*</span></label>
            <select className="post-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="sell">فروش</option>
              <option value="buy">خرید</option>
            </select>
          </div>

          <div className="post-section">
            <label className="post-label">عنوان آگهی <span className="required">*</span></label>
            <input
              className="post-input"
              placeholder="عنوان آگهی خود را بنویسید"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="post-section">
            <label className="post-label">توضیحات آگهی <span className="required">*</span></label>
            <textarea
              className="post-textarea"
              placeholder="توضیحات مربوط به آگهی را بنویسید"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button className="primary post-next" type="button" onClick={goNext}>بعدی</button>
        </div>
      </main>
    </div>
  );
}

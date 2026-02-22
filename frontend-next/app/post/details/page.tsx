"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBase } from "../../../lib/api";

export default function PostDetailsPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [workType, setWorkType] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [fixedPrice, setFixedPrice] = useState(false);
  const [extras, setExtras] = useState("");

  useEffect(() => {
    fetchProvinces();
  }, []);

  async function fetchProvinces() {
    const res = await fetch(`${apiBase}/locations/provinces/`);
    if (!res.ok) return;
    const data = await res.json();
    setProvinceOptions(data);
  }

  async function selectProvince(value) {
    setProvince(value);
    setCity("");
    setCityOptions([]);
    if (!value) return;
    const res = await fetch(`${apiBase}/locations/cities/?province=${value}`);
    if (!res.ok) return;
    const data = await res.json();
    setCityOptions(data);
  }

  return (
    <div className="app divar-app post-page">
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/post/category">بازگشت</Link>
        </div>
      </header>

      <main className="post-container">
        <div className="post-card">
          <div className="post-header">
            <div>
              <div className="post-step">ثبت آگهی</div>
              <h2>تکمیل اطلاعات</h2>
            </div>
          </div>

          <div className="post-section">
            <label className="post-label">استان <span className="required">*</span></label>
            <select className="post-input" value={province} onChange={(e) => selectProvince(e.target.value)}>
              <option value="">انتخاب استان</option>
              {provinceOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="post-section">
            <label className="post-label">شهر <span className="required">*</span></label>
            <select className="post-input" value={city} onChange={(e) => setCity(e.target.value)} disabled={!province}>
              <option value="">انتخاب شهر</option>
              {cityOptions.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="post-section">
            <h3 className="post-subtitle">ویژگی‌ها</h3>
          </div>

          <div className="post-section">
            <label className="post-label">نوع کالا <span className="required">*</span></label>
            <select className="post-input" value={workType} onChange={(e) => setWorkType(e.target.value)}>
              <option value="">انتخاب</option>
              <option value="new">نو</option>
              <option value="used">کارکرده</option>
              <option value="other">سایر</option>
            </select>
          </div>

          <div className="post-section">
            <label className="post-label">رنگ</label>
            <input className="post-input" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div className="post-section">
            <label className="post-label">وضعیت <span className="required">*</span></label>
            <select className="post-input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">انتخاب</option>
              <option value="excellent">عالی</option>
              <option value="good">خوب</option>
              <option value="ok">متوسط</option>
            </select>
          </div>

          <div className="post-section">
            <label className="post-label">قیمت (تومان) <span className="required">*</span></label>
            <input className="post-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="تومان" />
            <label className="checkbox-row">
              <input type="checkbox" checked={fixedPrice} onChange={(e) => setFixedPrice(e.target.checked)} />
              قیمت مقطوع است
            </label>
          </div>

          <div className="post-section">
            <label className="post-label">سایر ویژگی‌ها و امکانات</label>
            <button className="post-select" type="button">
              <span>{extras || "انتخاب"}</span>
              <span className="chevron">›</span>
            </button>
          </div>

          <button className="primary post-next" type="button">ثبت نهایی</button>
        </div>
      </main>
    </div>
  );
}

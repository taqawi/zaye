"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getApiBase, resolveMediaUrl } from "../lib/api";
import { ToastDialog, useToasts } from "../components/toast";

export default function HomePage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const { toasts, show } = useToasts();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    province: "",
    city: "",
    min_price: "",
    max_price: "",
    min_weight: "",
    max_weight: "",
    category_level2: "",
    category_level3: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryState, setCategoryState] = useState({ level: 1, level1: null, level2: null, items: [] });
  const [categoryDisplay, setCategoryDisplay] = useState("");
  const [categoryIds, setCategoryIds] = useState({ level2: "", level3: "" });
  const [orderedImages, setOrderedImages] = useState([]);
  const [categoryMegaOpen, setCategoryMegaOpen] = useState(false);
  const [level1Items, setLevel1Items] = useState([]);
  const [level2Items, setLevel2Items] = useState([]);
  const [level3Items, setLevel3Items] = useState([]);
  const [selectedLevel1, setSelectedLevel1] = useState(null);
  const [selectedLevel2, setSelectedLevel2] = useState(null);
  const [homeCategories, setHomeCategories] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedProvinceName, setSelectedProvinceName] = useState("");

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  useEffect(() => {
    fetchListings();
    fetchHomeCategories();
  }, []);

  async function fetchListings() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const res = await fetch(`${apiBase}/listings/${params.toString() ? `?${params}` : ""}`);
    if (!res.ok) {
      show("خطا در دریافت آگهی‌ها", "error");
      return;
    }
    const data = await res.json();
    setListings(data);
  }

  async function fetchHomeCategories() {
    const res = await fetch(`${apiBase}/categories/level1/`);
    if (!res.ok) return;
    const data = await res.json();
    setHomeCategories(data);
  }

  function formatPrice(item) {
    if (item.price_unit === "negotiable") return "قیمت توافقی";
    return `${Number(item.price_value).toLocaleString("fa-IR")} تومان`;
  }

  function ensureAuth() {
    if (accessToken) return true;
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

  async function openCreate() {
    if (!ensureAuth()) return;
    setCreateOpen(true);
  }

  async function openCategoryPicker() {
    const res = await fetch(`${apiBase}/categories/level1/`);
    const data = await res.json();
    setCategoryState({ level: 1, level1: null, level2: null, items: data });
    setCategoryOpen(true);
  }

  async function openCategoryMega() {
    const res = await fetch(`${apiBase}/categories/level1/`);
    const data = await res.json();
    setLevel1Items(data);
    setSelectedLevel1(data[0] || null);
    if (data[0]) {
      const res2 = await fetch(`${apiBase}/categories/level2/?parent=${data[0].id}`);
      const data2 = await res2.json();
      setLevel2Items(data2);
      setSelectedLevel2(null);
      setLevel3Items([]);
    }
    setCategoryMegaOpen(true);
  }

  async function selectMegaLevel1(item) {
    setSelectedLevel1(item);
    setSelectedLevel2(null);
    const res = await fetch(`${apiBase}/categories/level2/?parent=${item.id}`);
    const data = await res.json();
    setLevel2Items(data);
    setLevel3Items([]);
  }

  async function selectMegaLevel2(item) {
    setSelectedLevel2(item);
    const res = await fetch(`${apiBase}/categories/level3/?parent=${item.id}`);
    const data = await res.json();
    setLevel3Items(data);
  }

  function applyMegaCategory(level2, level3) {
    const parts = [selectedLevel1?.name, level2?.name, level3?.name].filter(Boolean);
    setCategoryDisplay(parts.join(" / "));
    setCategoryIds({ level2: level2?.id || "", level3: level3?.id || "" });
    setFilters((prev) => ({
      ...prev,
      category_level2: level2?.id ? String(level2.id) : "",
      category_level3: level3?.id ? String(level3.id) : "",
    }));
    setCategoryMegaOpen(false);
    fetchListings();
  }

  async function openCityPicker() {
    setCityOpen(true);
    if (provinceOptions.length === 0) {
      const res = await fetch(`${apiBase}/locations/provinces/`);
      if (res.ok) {
        const data = await res.json();
        setProvinceOptions(data);
      }
    }
  }

  async function selectProvince(provinceId) {
    setSelectedProvinceId(provinceId);
    const province = provinceOptions.find((item) => String(item.id) === String(provinceId));
    setSelectedProvinceName(province?.name || "");
    setCityOptions([]);
    const res = await fetch(`${apiBase}/locations/cities/?province=${provinceId}`);
    if (!res.ok) return;
    const data = await res.json();
    setCityOptions(data);
  }

  function applyCity(city) {
    setSelectedCity(city);
    setFilters({ ...filters, city: city || "" });
    setCityOpen(false);
  }

  async function selectLevel1(item) {
    if (!item.has_children) {
      show("این دسته زیرشاخه‌ای ندارد.");
      return;
    }
    const res = await fetch(`${apiBase}/categories/level2/?parent=${item.id}`);
    const data = await res.json();
    setCategoryState({ level: 2, level1: item, level2: null, items: data });
  }

  async function selectLevel2(item) {
    if (!item.has_children) {
      applyCategory(item, null, item);
      return;
    }
    const res = await fetch(`${apiBase}/categories/level3/?parent=${item.id}`);
    const data = await res.json();
    if (!data.length) {
      applyCategory(item, null, item);
      return;
    }
    setCategoryState((prev) => ({ ...prev, level: 3, level2: item, items: data }));
  }

  function selectLevel3(item) {
    applyCategory(categoryState.level2, item, categoryState.level1);
  }

  function applyCategory(level2, level3, level1) {
    const parts = [level1?.name, level2?.name, level3?.name].filter(Boolean);
    setCategoryDisplay(parts.join(" / "));
    setCategoryIds({ level2: level2?.id || "", level3: level3?.id || "" });
    setCategoryOpen(false);
  }

  function handleImageSelection(e) {
    const files = Array.from(e.target.files || []);
    setOrderedImages(files);
  }

  function moveImage(from, to) {
    if (to < 0 || to >= orderedImages.length) return;
    const copy = [...orderedImages];
    const moved = copy.splice(from, 1)[0];
    copy.splice(to, 0, moved);
    setOrderedImages(copy);
  }

  async function submitListing(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      type: form.elements["create-type"].value,
      title: form.elements["create-title"].value.trim(),
      category_level2_id: Number(categoryIds.level2),
      category_level3_id: categoryIds.level3 ? Number(categoryIds.level3) : null,
      weight_value: Number(form.elements["create-weight"].value),
      weight_unit: form.elements["create-weight-unit"].value,
      price_unit: form.elements["create-price-unit"].value,
      price_value: form.elements["create-price-unit"].value === "negotiable" ? null : Number(form.elements["create-price"].value),
      province: form.elements["create-province"].value.trim(),
      city: form.elements["create-city"].value.trim(),
      description: form.elements["create-description"].value.trim(),
    };

    if (!payload.category_level2_id) {
      show("لطفاً دسته‌بندی را انتخاب کنید.", "error");
      return;
    }

    if (payload.price_unit !== "negotiable" && !payload.price_value) {
      show("قیمت را وارد کنید یا واحد قیمت را توافقی قرار دهید.", "error");
      return;
    }

    const res = await fetch(`${apiBase}/listings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access")}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      show("ثبت آگهی ناموفق بود.", "error");
      return;
    }
    const created = await res.json();
    if (orderedImages.length) {
      for (let i = 0; i < orderedImages.length; i += 1) {
        const formData = new FormData();
        formData.append("image", orderedImages[i]);
        formData.append("sort_order", String(i));
        const uploadRes = await fetch(`${apiBase}/listings/${created.id}/images/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          show("آگهی ثبت شد، اما آپلود بعضی تصاویر ناموفق بود.", "error");
          break;
        }
      }
    }
    setCreateOpen(false);
    show("آگهی ثبت شد و منتظر تایید ادمین است.", "success");
    fetchListings();
  }

  return (
    <div className="app divar-app">
      <ToastDialog toasts={toasts} />
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center">
          <div className="search-bar">
            <input
              placeholder="جستجو در همه آگهی‌ها"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
            <button className="secondary" type="button" onClick={fetchListings}>جستجو</button>
          </div>
          <div className="topbar-filters">
            <div className="topbar-select">
              <span>دسته‌ها</span>
              <button className="link" type="button" onClick={openCategoryMega}>
                {categoryDisplay || "انتخاب"}
              </button>
            </div>
            <div className="topbar-select">
              <span>شهر</span>
              <button className="link" type="button" onClick={openCityPicker}>
                {selectedCity || selectedProvinceName || "انتخاب"}
              </button>
            </div>
          </div>
        </div>
        <div className="topbar-left">
          <Link className="primary" href="/post">ثبت آگهی</Link>
          <button className="link" type="button">دیوار من</button>
          <button className="link" type="button">چت و تماس</button>
          <button className="link" type="button">پشتیبانی</button>
        </div>
      </header>

      <div className="divar-shell">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h4>دسته‌ها</h4>
            <ul className="sidebar-list">
              {homeCategories.map((cat) => (
                <li key={cat.id}>{cat.name}</li>
              ))}
            </ul>
          </div>
          <div className="sidebar-section">
            <h4>محله</h4>
            <button className="link" type="button">انتخاب</button>
          </div>
          <div className="sidebar-section">
            <h4>قیمت (تومان)</h4>
            <div className="price-range">
              <input placeholder="از" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} />
              <input placeholder="تا" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} />
            </div>
          </div>
          <div className="sidebar-section">
            <h4>وزن</h4>
            <div className="price-range">
              <input placeholder="از" value={filters.min_weight} onChange={(e) => setFilters({ ...filters, min_weight: e.target.value })} />
              <input placeholder="تا" value={filters.max_weight} onChange={(e) => setFilters({ ...filters, max_weight: e.target.value })} />
            </div>
          </div>
          <div className="sidebar-section">
            <h4>نوع آگهی</h4>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">همه</option>
              <option value="buy">خرید</option>
              <option value="sell">فروش</option>
            </select>
          </div>
          <div className="actions">
            <button className="secondary" type="button" onClick={() => setFilters({ q: "", type: "", province: "", city: "", min_price: "", max_price: "", min_weight: "", max_weight: "" })}>
              پاک کردن
            </button>
          </div>
        </aside>

        <main className="content">
          <div className="section-header">
            <h2>انواع آگهی‌ها و نیازمندی‌های قم</h2>
            <span>{listings.length} مورد</span>
          </div>
          <div className="grid">
            {listings.map((item) => (
              <article className="card" key={item.id}>
                <img className="thumb" alt="" src={item.images?.[0]?.image ? resolveMediaUrl(item.images[0].image) : ""} />
                <div className="card-body">
                  <h3 className="title">{item.title}</h3>
                  <p className="meta">{item.province}، {item.city} • {item.type === "buy" ? "خرید" : "فروش"}</p>
                  <p className="price">{formatPrice(item)}</p>
                </div>
                <div className="card-actions">
                  <Link className="secondary" href={`/listing/${item.id}`}>مشاهده</Link>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      <div className="mobile-home">
        <div className="mobile-search">
          <span className="mobile-city">قم</span>
          <input
            placeholder="جستجو در همه آگهی‌ها"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <button className="mobile-search-btn" type="button" onClick={fetchListings}>جستجو</button>
        </div>

        <div className="mobile-categories">
          {homeCategories.map((cat) => (
            <button key={cat.id} className="mobile-cat" type="button">
              {cat.icon_svg ? (
                <span
                  className="mobile-cat-icon svg"
                  dangerouslySetInnerHTML={{ __html: cat.icon_svg }}
                />
              ) : (
                <span className="mobile-cat-icon">{cat.name?.[0] || "•"}</span>
              )}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="mobile-sort">
          <button className="link" type="button">پیشنهادی</button>
          <div>ترتیب نمایش آگهی‌ها</div>
        </div>

        <div className="mobile-list">
          {listings.map((item) => (
            <article className="card mobile-card" key={item.id}>
              <img className="thumb" alt="" src={item.images?.[0]?.image ? resolveMediaUrl(item.images[0].image) : ""} />
              <div className="card-body">
                <h3 className="title">{item.title}</h3>
                <p className="meta">{item.type === "buy" ? "خرید" : "فروش"}</p>
                <p className="price">{formatPrice(item)}</p>
              </div>
            </article>
          ))}
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

      <dialog open={createOpen} onClick={(e) => e.target === e.currentTarget && setCreateOpen(false)}>
        <div className="dialog-content">
          <header>
            <h3>ثبت آگهی جدید</h3>
            <button onClick={() => setCreateOpen(false)}>✕</button>
          </header>
          <form id="create-form" className="form-grid" onSubmit={submitListing}>
            <div className="field">
              <label>نوع آگهی</label>
              <select name="create-type" required>
                <option value="sell">فروش</option>
                <option value="buy">خرید</option>
              </select>
            </div>
            <div className="field">
              <label>عنوان</label>
              <input name="create-title" type="text" required />
            </div>
            <div className="field full">
              <label>دسته‌بندی</label>
              <div className="category-select">
                <input value={categoryDisplay} readOnly placeholder="انتخاب دسته‌بندی" />
                <button className="secondary" type="button" onClick={openCategoryPicker}>انتخاب</button>
              </div>
            </div>
            <div className="field">
              <label>وزن</label>
              <input name="create-weight" type="number" step="0.001" required />
            </div>
            <div className="field">
              <label>واحد وزن</label>
              <select name="create-weight-unit" required>
                <option value="ton">تن</option>
                <option value="kg">کیلوگرم</option>
                <option value="piece">عدد</option>
              </select>
            </div>
            <div className="field">
              <label>قیمت</label>
              <input name="create-price" type="number" step="0.01" />
            </div>
            <div className="field">
              <label>واحد قیمت</label>
              <select name="create-price-unit" required>
                <option value="toman_per_ton">تومان / تن</option>
                <option value="toman_per_kg">تومان / کیلو</option>
                <option value="toman_per_piece">تومان / عدد</option>
                <option value="toman_per_ampere">تومان / آمپر</option>
                <option value="negotiable">توافقی</option>
              </select>
            </div>
            <div className="field">
              <label>استان</label>
              <input name="create-province" type="text" required />
            </div>
            <div className="field">
              <label>شهر</label>
              <input name="create-city" type="text" required />
            </div>
            <div className="field full">
              <label>توضیحات</label>
              <textarea name="create-description" rows={3}></textarea>
            </div>
            <div className="field full">
              <label>تصاویر آگهی</label>
              <input name="create-images" type="file" accept="image/*" multiple onChange={handleImageSelection} />
              <div className="image-preview">
                {orderedImages.map((file, index) => (
                  <div key={file.name + index} className="preview-item" draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      moveImage(from, index);
                    }}>
                    <img src={URL.createObjectURL(file)} alt={file.name} />
                    <div className="preview-actions">
                      <button type="button" onClick={() => moveImage(index, index - 1)}>↑</button>
                      <button type="button" onClick={() => moveImage(index, index + 1)}>↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="actions">
              <button className="secondary" type="button" onClick={() => setCreateOpen(false)}>انصراف</button>
              <button className="primary" type="submit">ثبت آگهی</button>
            </div>
          </form>
        </div>
      </dialog>

      <dialog open={categoryOpen} onClick={(e) => e.target === e.currentTarget && setCategoryOpen(false)}>
        <div className="dialog-content">
          <header className="category-header">
            <button
              className="secondary"
              type="button"
              onClick={async () => {
                if (categoryState.level === 3 && categoryState.level1) {
                  const res = await fetch(`${apiBase}/categories/level2/?parent=${categoryState.level1.id}`);
                  const data = await res.json();
                  setCategoryState({ level: 2, level1: categoryState.level1, level2: null, items: data });
                  return;
                }
                if (categoryState.level === 2) {
                  openCategoryPicker();
                }
              }}
            >
              بازگشت
            </button>
            <h3>انتخاب دسته‌بندی</h3>
            <button onClick={() => setCategoryOpen(false)}>✕</button>
          </header>
          <div className="category-path">
            {[categoryState.level1?.name, categoryState.level2?.name].filter(Boolean).join(" / ") || "انتخاب دسته‌بندی"}
          </div>
          <ul className="category-list">
            {categoryState.items.map((item) => (
              <li key={item.id}>
                <button className="category-item" type="button" onClick={() =>
                  categoryState.level === 1 ? selectLevel1(item) : categoryState.level === 2 ? selectLevel2(item) : selectLevel3(item)
                }>
                  <span>{item.name}</span>
                  {(item.has_children && categoryState.level !== 3) && <span className="chevron">›</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>

      <dialog open={categoryMegaOpen} onClick={(e) => e.target === e.currentTarget && setCategoryMegaOpen(false)}>
        <div className="dialog-content category-mega">
          <header className="category-mega-header">
            <h3>دسته‌ها</h3>
            <button className="link" type="button" onClick={() => setCategoryMegaOpen(false)}>✕</button>
          </header>
          <div className="category-mega-body">
            <aside className="category-mega-sidebar">
              <button
                className="category-mega-all"
                type="button"
                onClick={() => {
                  setCategoryDisplay("");
                  setCategoryIds({ level2: "", level3: "" });
                  setFilters((prev) => ({ ...prev, category_level2: "", category_level3: "" }));
                  setCategoryMegaOpen(false);
                  fetchListings();
                }}
              >
                همه آگهی‌ها
              </button>
              {level1Items.map((item) => (
                <button
                  key={item.id}
                  className={`category-mega-item ${selectedLevel1?.id === item.id ? "active" : ""}`}
                  type="button"
                  onClick={() => selectMegaLevel1(item)}
                >
                  <span>{item.name}</span>
                  {item.has_children && <span className="chevron">›</span>}
                </button>
              ))}
            </aside>
            <div className="category-mega-content">
              <div className="category-single">
                <h4>{selectedLevel1?.name || "دسته‌ها"}</h4>
                {level2Items.map((item) => (
                  <div key={item.id} className="category-branch">
                    <button
                      className={`category-mega-item ${selectedLevel2?.id === item.id ? "active" : ""}`}
                      type="button"
                      onClick={() => selectMegaLevel2(item)}
                    >
                      <span>{item.name}</span>
                      {item.has_children && <span className="chevron">›</span>}
                    </button>
                    {selectedLevel2?.id === item.id && (
                      <div className="category-children">
                        <button className="category-mega-item child" type="button" onClick={() => applyMegaCategory(item, null)}>
                          <span>همه آگهی‌های {item.name}</span>
                        </button>
                        {level3Items.map((child) => (
                          <button
                            key={child.id}
                            className="category-mega-item child"
                            type="button"
                            onClick={() => applyMegaCategory(item, child)}
                          >
                            <span>{child.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </dialog>

      <dialog open={cityOpen} onClick={(e) => e.target === e.currentTarget && setCityOpen(false)}>
        <div className="dialog-content city-dialog">
          <header className="city-header">
            <h3>انتخاب شهر</h3>
            <button className="link danger" type="button" onClick={() => applyCity("")}>حذف همه</button>
          </header>
          <div className="city-search">
            <input
              placeholder="جستجو در شهرها"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
            />
          </div>
          <div className="city-province">
            <label>استان</label>
            <select value={selectedProvinceId} onChange={(e) => selectProvince(e.target.value)}>
              <option value="">انتخاب استان</option>
              {provinceOptions.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
          </div>
          <div className="city-tags">
            {selectedCity && (
              <button className="city-tag" type="button" onClick={() => applyCity("")}>
                {selectedCity} ✕
              </button>
            )}
          </div>
          <div className="city-list">
            {cityOptions
              .filter((city) => city.name.includes(cityQuery))
              .map((city) => (
                <button key={city.id} className="city-row" type="button" onClick={() => applyCity(city.name)}>
                  <span>{city.name}</span>
                  <span className="chevron">›</span>
                </button>
              ))}
          </div>
          <div className="city-actions">
            <button className="secondary" type="button" onClick={() => setCityOpen(false)}>انصراف</button>
            <button className="primary" type="button" onClick={() => applyCity(selectedCity || "")}>تأیید</button>
          </div>
        </div>
      </dialog>

      <nav className="bottom-nav" aria-label="navigation">
        <button className="nav-item" type="button">خانه</button>
        <button className="nav-item" type="button">جستجو</button>
        <Link className="nav-item primary-nav" href="/post">
          <span className="nav-icon plus">+</span>
        </Link>
        <button className="nav-item" type="button">چت</button>
        <button className="nav-item" type="button">پروفایل</button>
      </nav>
    </div>
  );
}

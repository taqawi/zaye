"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBase } from "../../../lib/api";

export default function PostCategoryPage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [level, setLevel] = useState(1);
  const [level1, setLevel1] = useState(null);
  const [level2, setLevel2] = useState(null);
  const [title, setTitle] = useState("انتخاب دسته");

  useEffect(() => {
    fetchLevel1();
  }, []);

  async function fetchLevel1() {
    const res = await fetch(`${apiBase}/categories/level1/`);
    const data = await res.json();
    setItems(data);
    setLevel(1);
    setLevel1(null);
    setLevel2(null);
    setTitle("انتخاب دسته");
  }

  async function selectLevel1(item) {
    if (!item.has_children) {
      saveSelection(item, null, null);
      return;
    }
    const res = await fetch(`${apiBase}/categories/level2/?parent=${item.id}`);
    const data = await res.json();
    setItems(data);
    setLevel(2);
    setLevel1(item);
    setLevel2(null);
    setTitle(item.name);
  }

  async function selectLevel2(item) {
    if (!item.has_children) {
      saveSelection(level1, item, null);
      return;
    }
    const res = await fetch(`${apiBase}/categories/level3/?parent=${item.id}`);
    const data = await res.json();
    if (!data.length) {
      saveSelection(level1, item, null);
      return;
    }
    setItems(data);
    setLevel(3);
    setLevel2(item);
    setTitle(item.name);
  }

  function selectLevel3(item) {
    saveSelection(level1, level2, item);
  }

  function saveSelection(l1, l2, l3) {
    const payload = {
      level1: l1 ? { id: l1.id, name: l1.name } : null,
      level2: l2 ? { id: l2.id, name: l2.name } : null,
      level3: l3 ? { id: l3.id, name: l3.name } : null,
    };
    localStorage.setItem("post_category", JSON.stringify(payload));
    router.push("/post/details");
  }

  async function handleBack() {
    if (level === 3 && level1) {
      const res = await fetch(`${apiBase}/categories/level2/?parent=${level1.id}`);
      const data = await res.json();
      setItems(data);
      setLevel(2);
      setLevel2(null);
      setTitle(level1.name);
      return;
    }
    if (level === 2) {
      fetchLevel1();
    }
  }

  return (
    <div className="app divar-app post-page">
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ضایع</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/post">بازگشت</Link>
        </div>
      </header>

      <main className="post-container">
        <div className="post-card">
          <div className="post-header">
            <div>
              <div className="post-step">ثبت آگهی</div>
              <h2>{title}</h2>
            </div>
          </div>

          <div className="post-section">
            <button className="post-back" type="button" onClick={handleBack}>
              بازگشت به همه پیشنهاد دسته آگهی
              <span>→</span>
            </button>
            <div className="post-category-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="post-category-row"
                  type="button"
                  onClick={() => {
                    if (level === 1) {
                      selectLevel1(item);
                    } else if (level === 2) {
                      selectLevel2(item);
                    } else {
                      selectLevel3(item);
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {item.has_children && level !== 3 && <span className="chevron">›</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

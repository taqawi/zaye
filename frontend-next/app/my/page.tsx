"use client";

import Link from "next/link";

export default function MyPage() {
  const phone = "09127500188";

  const items = [
    { label: "ط¯غŒظˆط§ط± ط­ط±ظپظ‡â€Œط§غŒ", icon: "â­گ" },
    { label: "طھط£غŒغŒط¯ ظ‡ظˆغŒطھ", icon: "ًں›،ï¸ڈ" },
    { label: "ط¢ع¯ظ‡غŒâ€Œظ‡ط§غŒ ظ…ظ†", icon: "ًں“„" },
    { label: "ع©غŒظپ ظ¾ظˆظ„ ظˆ ظ¾ط±ط¯ط§ط®طھâ€Œظ‡ط§", icon: "ًں’³" },
    { label: "ظ†ط´ط§ظ†â€Œظ‡ط§", icon: "ًں”–" },
    { label: "ط¨ط§ط²ط¯غŒط¯ظ‡ط§غŒ ط§ط®غŒط±", icon: "ًں•ک" },
    { label: "ظ…ظ‚ط§ط¨ظ„ظ‡ ط¨ط§ ظ…ط²ط§ط­ظ…طھ ظˆ ع©ظ„ط§ظ‡ط¨ط±ط¯ط§ط±غŒ", icon: "ًں›‘" },
    { label: "ط®ط±ظˆط¬", icon: "ًںڑھ" },
    { label: "ظ‚ظˆط§ظ†غŒظ†", icon: "ًں“œ" },
    { label: "ط¯ط±ط¨ط§ط±ظ‡ ط¯غŒظˆط§ط±", icon: "â„¹ï¸ڈ" },
    { label: "ط¯ط±غŒط§ظپطھ ط¨ط±ظ†ط§ظ…ظ‡", icon: "â¬‡ï¸ڈ" },
    { label: "طھظ†ط¸غŒظ…ط§طھ", icon: "âڑ™ï¸ڈ" },
    { label: "ظ¾ط´طھغŒط¨ط§ظ†غŒ", icon: "ًں“‍" },
  ];

  return (
    <div className="app divar-app my-page">
      <header className="divar-topbar">
        <div className="topbar-right">
          <span className="brand">ط¶ط§غŒط¹</span>
        </div>
        <div className="topbar-center" />
        <div className="topbar-left">
          <Link className="link" href="/">ط¨ط§ط²ع¯ط´طھ</Link>
        </div>
      </header>

      <div className="my-header">
        <div className="my-title">تنظیمات</div>
        <div className="my-user">
          <div className="my-avatar">ًں‘¤</div>
          <div>
            <div className="my-name">ع©ط§ط±ط¨ط± ط¯غŒظˆط§ط±</div>
            <div className="my-phone">{phone}</div>
          </div>
        </div>
      </div>

      <div className="my-list">
        {items.map((item) => (
          <button key={item.label} className="my-row" type="button">
            <span className="my-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <nav className="bottom-nav" aria-label="navigation">
        <button className="nav-item" type="button">ط¢ع¯ظ‡غŒâ€Œظ‡ط§</button>
        <button className="nav-item" type="button">ع†طھ ظˆ طھظ…ط§ط³</button>
        <Link className="nav-item primary-nav" href="/post">
          <span className="nav-icon plus">+</span>
        </Link>
        <button className="nav-item" type="button">ظ†ط´ط§ظ†â€Œظ‡ط§</button>
        <button className="nav-item active" type="button">ط¯غŒظˆط§ط± ظ…ظ†</button>
      </nav>
    </div>
  );
}

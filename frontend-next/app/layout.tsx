import "./globals.css";

export const metadata = {
  title: "ضایع | بازارچه ضایعات",
  description: "بازارچه ضایعات با آگهی‌های خرید و فروش",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
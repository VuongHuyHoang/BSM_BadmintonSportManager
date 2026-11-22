import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSM - Quản Lý Nhóm Cầu Lông & Chia Tiền Tự Động",
  description: "Hệ thống quản lý chi phí, điểm danh và chia tiền thông minh qua VietQR cho nhóm cầu lông phong trào.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#dceeff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#dceeff] text-black antialiased selection:bg-[#ffd731] selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}

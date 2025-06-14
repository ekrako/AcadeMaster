import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { HourTypesProvider } from "@/contexts/HourTypesContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "AcadeMaster - מערכת הקצאת שעות למורים",
  description: "מערכת לניהול הקצאת שעות שבועיות למורים בבית ספר יסודי",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-hebrew rtl bg-gray-50">
        <AuthProvider>
          <HourTypesProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </HourTypesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
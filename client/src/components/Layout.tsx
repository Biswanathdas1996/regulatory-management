import React, { ReactNode } from "react";
import { Header } from "@/components/Header";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
};

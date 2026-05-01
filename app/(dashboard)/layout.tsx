import MobileNav from "@/components/layout/MobileNav";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <div className="hidden md:flex">
      <Sidebar />
    </div>
    <div className="flex md:hidden">
      <TopNav />
    </div>
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
    </>
  );
}

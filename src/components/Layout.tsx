import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  PuzzlePieceIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "仪表盘", href: "/", icon: HomeIcon },
  { name: "用户管理", href: "/users", icon: UsersIcon },
  { name: "游戏审核", href: "/games", icon: PuzzlePieceIcon },
  { name: "首页游戏库", href: "/index-games", icon: RectangleStackIcon },
  { name: "分类配置", href: "/categories", icon: RectangleStackIcon },
  { name: "审核日志", href: "/review-logs", icon: ClipboardDocumentListIcon },
  { name: "积分配置", href: "/credits", icon: CreditCardIcon },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-heading font-bold text-primary">
            GamifyAgent Admin
          </h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-smooth"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: fixed, Mobile: slide-in */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Desktop only */}
          <div className="hidden lg:flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-heading font-bold text-primary">
              GamifyAgent Admin
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto mt-16 lg:mt-0">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-smooth cursor-pointer
                    ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-smooth cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

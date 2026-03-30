import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-primary-600">
            🏠 AccoDiscover
          </a>
          <nav className="flex gap-4 items-center">
            <a href="/search" className="text-gray-600 hover:text-primary-600">Tìm kiếm</a>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{currentUser.displayName || currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary-600 font-medium"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <a href="/login" className="text-gray-600 hover:text-primary-600">Đăng nhập</a>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          © 2026 Accommodation Discovery Platform
        </div>
      </footer>
    </div>
  );
}

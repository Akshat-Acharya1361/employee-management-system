import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { FlashNotice } from './components/FlashNotice';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';
import { EmployeeEditPage } from './pages/EmployeeEditPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPanel } from './pages/NotFoundPanel';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/employees" className="app-header__brand">
            <span className="app-header__mark" aria-hidden="true">EM</span>
            Employee Management
          </Link>
          {session && (
            <div className="app-header__user">
              <span className="app-header__username">
                <span className="visually-hidden">Signed in as </span>
                {session.username}
              </span>
              <button
                type="button"
                className="button button--small app-header__logout"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main id="main-content" className="app-main">
        {/* Remount per page so a message does not follow the user to another page */}
        <FlashNotice key={location.pathname} />
        <Outlet />
      </main>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/new" element={<EmployeeCreatePage />} />
          <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
          <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
          <Route path="*" element={<NotFoundPanel message="This page does not exist." />} />
        </Route>
      </Route>
    </Routes>
  );
}

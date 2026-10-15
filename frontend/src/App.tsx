import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { FlashNotice } from './components/FlashNotice';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';
import { EmployeeEditPage } from './pages/EmployeeEditPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { NotFoundPanel } from './pages/NotFoundPanel';

function Layout() {
  const location = useLocation();
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/employees" className="app-header__brand">
            <span className="app-header__mark" aria-hidden="true">EM</span>
            Employee Management
          </Link>
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
        <Route index element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<EmployeeCreatePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
        <Route path="*" element={<NotFoundPanel message="This page does not exist." />} />
      </Route>
    </Routes>
  );
}

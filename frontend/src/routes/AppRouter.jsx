import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useScrollToTop } from '../hooks/useScrollToTop.js';
import HomePage from '../pages/HomePage.jsx';
import SalonPublicPage from '../pages/SalonPublicPage.jsx';
import RegisterSalonPage from '../pages/RegisterSalonPage.jsx';
import OwnerLoginPage from '../pages/OwnerLoginPage.jsx';
import OwnerDashboardPage from '../pages/OwnerDashboardPage.jsx';

function RootLayout() {
  useScrollToTop();
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'register-salon', element: <RegisterSalonPage /> },
      { path: 'owner/login', element: <OwnerLoginPage /> },
      { path: 'owner/dashboard', element: <OwnerDashboardPage /> },
      { path: 's/:salonId', element: <SalonPublicPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

export default function AppRouter() {
  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
}

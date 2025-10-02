import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useScrollToTop } from '../hooks/useScrollToTop.js';
import PublicRoute from '../components/PublicRoute.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
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
      { 
        path: 'register-salon', 
        element: (
          <PublicRoute>
            <RegisterSalonPage />
          </PublicRoute>
        )
      },
      { 
        path: 'owner/login', 
        element: (
          <PublicRoute>
            <OwnerLoginPage />
          </PublicRoute>
        )
      },
      { 
        path: 'owner/dashboard', 
        element: (
          <ProtectedRoute>
            <OwnerDashboardPage />
          </ProtectedRoute>
        )
      },
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

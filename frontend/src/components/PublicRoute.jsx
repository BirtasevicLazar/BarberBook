import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/api.js';

// Component that redirects authenticated users away from auth pages
export default function PublicRoute({ children }) {
  const token = getToken();
  
  // If user is logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/owner/dashboard" replace />;
  }
  
  // If not logged in, render the children (login/register pages)
  return children;
}
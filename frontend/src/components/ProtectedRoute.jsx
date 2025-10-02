import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/api.js';

// Component that protects authenticated routes
export default function ProtectedRoute({ children }) {
  const token = getToken();
  
  // If user is not logged in, redirect to login page
  if (!token) {
    return <Navigate to="/owner/login" replace />;
  }
  
  // If logged in, render the children (protected pages)
  return children;
}
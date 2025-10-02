import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from './Container.jsx';
import { getToken, removeToken } from '../../lib/api.js';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthState = () => {
      const token = getToken();
      setIsLoggedIn(!!token);
      
      if (token) {
        // Get user info from localStorage if available
        const salonId = localStorage.getItem('salon_id');
        if (salonId) {
          setUserInfo({ salonId });
        }
      } else {
        setUserInfo(null);
      }
    };

    // Check initial state
    checkAuthState();

    // Listen for storage changes (when auth state changes in other tabs or components)
    window.addEventListener('storage', checkAuthState);
    
    // Custom event for same-tab auth changes
    window.addEventListener('authStateChanged', checkAuthState);

    return () => {
      window.removeEventListener('storage', checkAuthState);
      window.removeEventListener('authStateChanged', checkAuthState);
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('salon_id');
    setIsLoggedIn(false);
    setUserInfo(null);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-semibold text-gray-900">
            BarberBook
          </Link>
          
          {/* Desktop Menu */}
                    {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-zinc-700 hover:text-zinc-900 font-light tracking-tight transition-colors"
            >
              Početna
            </Link>
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/register-salon" 
                  className="text-zinc-700 hover:text-zinc-900 font-light tracking-tight transition-colors"
                >
                  Registruj salon
                </Link>
                <Link 
                  to="/owner/login" 
                  className="bg-zinc-900 text-white px-4 py-2 text-sm rounded-full hover:bg-zinc-800 font-light tracking-tight transition-all duration-200 hover:scale-[1.02]"
                >
                  Prijava
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/owner/dashboard" 
                  className="text-zinc-700 hover:text-zinc-900 font-light tracking-tight transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-zinc-900 text-white px-4 py-2 text-sm rounded-full hover:bg-zinc-800 font-light tracking-tight transition-all duration-200 hover:scale-[1.02]"
                >
                  Odjavi se
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className={`w-5 h-0.5 bg-gray-900 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-gray-900 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-gray-900 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200">
            <div className="py-4 space-y-2">
              <Link 
                to="/" 
                className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Početna
              </Link>
              {!isLoggedIn ? (
                <>
                  <Link 
                    to="/register-salon" 
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Za salone
                  </Link>
                  <Link 
                    to="/owner/login" 
                    className="block mx-4 mt-4 px-4 py-2 text-center text-sm font-light tracking-tight text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Prijava
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/owner/dashboard" 
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block mx-4 mt-4 px-4 py-2 text-center text-sm font-light tracking-tight text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all duration-200 w-[calc(100%-2rem)]"
                  >
                    Odjavi se
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

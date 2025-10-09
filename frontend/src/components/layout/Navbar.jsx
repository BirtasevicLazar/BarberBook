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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className={`flex items-center gap-2 text-lg font-semibold text-gray-900 transition-opacity duration-200 ${isMenuOpen ? 'md:opacity-100 opacity-0' : 'opacity-100'}`}
          >
            <img 
              src="/BarberBookLogo.png" 
              alt="BarberBook Logo" 
              className="w-8 h-8 object-contain"
            />
            <span>BarberBook</span>
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
            className="md:hidden p-2 z-[102] relative"
            aria-label="Menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              {!isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Mobile Menu Backdrop */}
        {isMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Panel */}
        <div className={`md:hidden fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white border-l border-zinc-200/50 z-[101] transform transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-xl font-semibold text-gray-900"
              onClick={() => setIsMenuOpen(false)}
            >
              <img 
                src="/BarberBookLogo.png" 
                alt="BarberBook Logo" 
                className="w-8 h-8 object-contain"
              />
              <span>BarberBook</span>
            </Link>
          </div>

          {/* Menu Content */}
          <div className="px-6 pt-8 pb-6">
            <nav className="space-y-8">
              <Link 
                to="/" 
                className="block text-xl font-light text-zinc-700 hover:text-zinc-900 transition-colors border-b border-zinc-100 pb-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Početna
              </Link>
              {!isLoggedIn ? (
                <>
                  <Link 
                    to="/register-salon" 
                    className="block text-xl font-light text-zinc-700 hover:text-zinc-900 transition-colors border-b border-zinc-100 pb-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registruj salon
                  </Link>
                  <div className="pt-4">
                    <Link 
                      to="/owner/login" 
                      className="block w-full px-8 py-4 text-center text-base font-light tracking-tight text-white bg-zinc-900 rounded-full hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Prijava
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/owner/dashboard" 
                    className="block text-xl font-light text-zinc-700 hover:text-zinc-900 transition-colors border-b border-zinc-100 pb-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="pt-4">
                    <button
                      onClick={handleLogout}
                      className="block w-full px-8 py-4 text-center text-base font-light tracking-tight text-white bg-zinc-900 rounded-full hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-200"
                    >
                      Odjavi se
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </Container>
    </nav>
  );
}

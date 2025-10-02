import { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from './Container.jsx';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-semibold text-gray-900">
            BarberBook
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Početna
            </Link>
            <Link 
              to="/register-salon" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Registruj salon
            </Link>
            <Link 
              to="/owner/login" 
              className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all"
            >
              Prijava
            </Link>
          </div>

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
              <Link 
                to="/register-salon" 
                className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Za salone
              </Link>
              <Link 
                to="/owner/login" 
                className="block mx-4 mt-4 px-4 py-2 text-center text-sm font-medium text-white bg-gray-900 rounded-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Prijava
              </Link>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

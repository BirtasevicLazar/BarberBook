import Container from './Container.jsx';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <Container>
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1">
              <div className="text-xl font-light text-gray-900 mb-4">
                BarberBook
              </div>
              <p className="text-gray-600 text-sm leading-relaxed font-light max-w-xs">
                Digitalizacija frizerskih salona kroz moderan sistem online rezervacija.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Proizvod</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-light">
                <li><Link to="/register-salon" className="hover:text-gray-900 transition-colors">Registracija</Link></li>
                <li><Link to="/owner/login" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Funkcije</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Cene</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Podrška</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-light">
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Dokumentacija</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Pomoć</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Kontakt</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Status</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Kompanija</h3>
              <ul className="space-y-3 text-sm text-gray-600 font-light">
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">O nama</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Blog</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Karijera</span></li>
                <li><span className="hover:text-gray-900 transition-colors cursor-pointer">Partneri</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-gray-500 text-xs font-light">
                © {new Date().getFullYear()} BarberBook. Sva prava zadržana.
              </div>
              <div className="flex space-x-6 mt-4 sm:mt-0">
                <span className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer font-light">
                  Privatnost
                </span>
                <span className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer font-light">
                  Uslovi
                </span>
                <span className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer font-light">
                  Cookies
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

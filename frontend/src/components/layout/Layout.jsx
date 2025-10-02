import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="min-h-[calc(100vh-56px)] pt-14">
        {children}
      </main>
      <Footer />
    </div>
  );
}

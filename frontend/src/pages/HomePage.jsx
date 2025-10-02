import Navbar from '../components/layout/Navbar';
import Hero from '../components/Hero';
import HomeContent from '../components/HomeContent';
import Footer from '../components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HomeContent />
      <Footer />
    </div>
  );
}

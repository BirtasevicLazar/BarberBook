import Container from './layout/Container';
import { Link } from 'react-router-dom';
import PozadinaVideo from '../assets/pozadina.mp4';

export default function Hero() {
  const scrollToNext = () => {
    const viewportHeight = window.innerHeight;
    const navbarHeight = 56; // h-14 = 56px
    
    try {
      window.scrollTo({
        top: viewportHeight - navbarHeight,
        behavior: 'smooth'
      });
    } catch (e) {
      // Fallback for older browsers
      window.scrollTo(0, viewportHeight - navbarHeight);
    }
  };

  return (
    <section className="relative h-screen overflow-hidden">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className="w-full h-full object-cover"
        src={PozadinaVideo}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full pt-14">
        <Container>
          <div className="text-center text-white max-w-5xl mx-auto px-6">
            {/* Main heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight leading-[1.1] mb-12 tracking-tight">
              Digitalizujte svoj
              <br />
              <span className="font-light text-white/90">
                frizerski salon
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
              Jednostavan sistem za online rezervacije koji povećava vašu zaradu 24/7
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/register-salon"
                className="px-10 py-4 text-base font-medium text-gray-900 bg-white/95 rounded-full hover:bg-white transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                Kreiraj salon besplatno
              </Link>
              <Link 
                to="/owner/login"
                className="px-10 py-4 text-base font-medium text-white bg-white/5 backdrop-blur-md border border-white/30 rounded-full hover:bg-white/10 transition-all duration-300"
              >
                Prijavi se
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Animated Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button 
          onClick={scrollToNext}
          className="flex flex-col items-center animate-bounce hover:animate-none transition-all duration-300 cursor-pointer group"
        >
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center p-2 group-hover:border-white/80 transition-colors">
            <div className="w-1 h-3 bg-white/80 rounded-full animate-pulse group-hover:bg-white transition-colors"></div>
          </div>
          <div className="mt-2 text-white/60 text-xs font-light group-hover:text-white/80 transition-colors">Skroluj</div>
        </button>
      </div>
    </section>
  );
}
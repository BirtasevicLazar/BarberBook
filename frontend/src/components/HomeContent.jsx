import Container from './layout/Container';
import { Link } from 'react-router-dom';

const features = [
  {
    title: "Online rezervacije",
    subtitle: "24/7 dostupnost",
    description: "Vaši klijenti rezervišu termine bilo kada, bez poziva ili čekanja"
  },
  {
    title: "Upravljanje salonom",
    subtitle: "Sve na jednom mestu",
    description: "Kontrolišite frizere, usluge, termine i finansije iz jednog dashboard-a"
  },
  {
    title: "Automatizacija procesa",
    subtitle: "Pametan sistem",
    description: "Automatski podsetnici, upravljanje slobodnim terminima i detaljne statistike"
  }
];

export default function HomeContent() {
  return (
    <>
      {/* Hero Features - Apple Style */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-tight">
              Sve što vam salon treba.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Digitalizujte svoj salon sa sistemom koji radi za vas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">
                  {feature.subtitle}
                </p>
                <p className="text-gray-600 leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Simple Steps */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-tight">
              Jednostavno pokretanje.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Od ideje do prve rezervacije za manje od 5 minuta.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="text-5xl font-light text-gray-400 mb-3">1</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Registrujte salon</h3>
                  <p className="text-gray-600 font-light leading-relaxed">Osnovne informacije, adresa, kontakt. To je sve.</p>
                </div>
                <div className="md:w-1/2 h-48 rounded-xl overflow-hidden">
                  <img 
                    src="/Salon.jpg" 
                    alt="Salon dashboard" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="text-5xl font-light text-gray-400 mb-3">2</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Dodajte tim</h3>
                  <p className="text-gray-600 font-light leading-relaxed">Frizeri, usluge, cene, radno vreme. Sve na jednom mestu.</p>
                </div>
                <div className="md:w-1/2 h-48 rounded-xl overflow-hidden">
                  <img 
                    src="/Barber.jpg" 
                    alt="Team management" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="text-5xl font-light text-gray-400 mb-3">3</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Podelite link</h3>
                  <p className="text-gray-600 font-light leading-relaxed">Jedan link, beskonačno rezervacija. Jednostavno kao što zvuči.</p>
                </div>
                <div className="md:w-1/2 h-48 rounded-xl overflow-hidden">
                  <img 
                    src="/Share.jpg" 
                    alt="Online booking" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA - Apple Style */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-tight">
              Spremni za sledeći korak?
            </h2>
            <p className="text-lg text-gray-600 mb-12 font-light leading-relaxed">
              Pridružite se vlasnicima koji su već transformisali svoje salone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register-salon"
                className="px-8 py-3 text-base font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all duration-300"
              >
                Kreiraj salon besplatno
              </Link>
              <Link 
                to="/owner/login"
                className="px-8 py-3 text-base font-medium text-gray-600 bg-transparent border border-gray-300 rounded-full hover:border-gray-900 hover:text-gray-900 transition-all duration-300"
              >
                Već imate nalog?
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
import OwnerCreateSalonForm from '../components/forms/OwnerCreateSalonForm.jsx';
import Layout from '../components/layout/Layout.jsx';
import Container from '../components/layout/Container.jsx';

export default function RegisterSalonPage() {
  return (
    <Layout>
      <Container>
        <div className="py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Registruj salon
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kreirajte svoj salon za manje od 5 minuta i počnite da primate rezervacije online.
            </p>
          </div>

          {/* Form Section */}
          <div className="max-w-2xl mx-auto">
            <OwnerCreateSalonForm />
          </div>
        </div>
      </Container>
    </Layout>
  );
}

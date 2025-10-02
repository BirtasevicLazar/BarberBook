import OwnerCreateSalonForm from '../components/forms/OwnerCreateSalonForm.jsx';
import Layout from '../components/layout/Layout.jsx';
import Container from '../components/layout/Container.jsx';

export default function RegisterSalonPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Form Section */}
        <section className="pt-8 pb-16">
          <Container>
            <div className="max-w-3xl mx-auto">
              <OwnerCreateSalonForm />
            </div>
          </Container>
        </section>
      </div>
    </Layout>
  );
}

import Hero from '@/components/Hero/Hero';
import OriaSpaTabs from '@/components/OriaSpa/OriaSpaTabs';
import SeoStructuredData from '@/components/Seo/SeoStructuredData';
import { getHeroVideoConfig } from '@/lib/config/heroVideos';

export const dynamic = 'force-dynamic';

const HomePage = async () => {
  const initialHeroConfig = await getHeroVideoConfig();

  return (
    <>
      <main>
        {/* Hero Section - Fullscreen with video/image background */}
        <Hero initialHeroConfig={initialHeroConfig} />

        <OriaSpaTabs />
      </main>
      <SeoStructuredData routeKey="home" locale="vi" pathname="/" />
    </>
  );
};

export default HomePage;

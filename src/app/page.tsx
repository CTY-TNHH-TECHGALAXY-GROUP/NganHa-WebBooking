import Hero from '@/components/Hero/Hero';
import OurStory from '@/components/OurStory/OurStory';
import History from '@/components/History/History';
import { getHeroVideoConfig } from '@/lib/config/heroVideos';

export const dynamic = 'force-dynamic';

const HomePage = async () => {
  const initialHeroConfig = await getHeroVideoConfig();

  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero initialHeroConfig={initialHeroConfig} />

      {/* Our Story Section - Saigon & Oria Location, Architecture & Film Strip */}
      <OurStory />

      {/* History / About Story Section */}
      <History />
    </main>
  );
};

export default HomePage;

'use client';

import Hero from '@/components/Hero/Hero';
import OurStory from '@/components/OurStory/OurStory';
import History from '@/components/History/History';

const HomePage = () => {
  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero />

      {/* Our Story Section - Saigon & Oria Location, Architecture & Film Strip */}
      <OurStory />

      {/* History / About Story Section */}
      <History />
    </main>
  );
};

export default HomePage;

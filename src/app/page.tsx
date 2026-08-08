'use client';

import Hero from '@/components/Hero/Hero';
import AboutStory from '@/components/AboutStory/AboutStory';

const HomePage = () => {
  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero />

      {/* History / About Story Section */}
      <AboutStory />
    </main>
  );
};

export default HomePage;

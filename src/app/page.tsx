'use client';

import Hero from '@/components/Hero/Hero';
import History from '@/components/History/History';

const HomePage = () => {
  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero />

      {/* History / About Story Section */}
      <History />
    </main>
  );
};

export default HomePage;

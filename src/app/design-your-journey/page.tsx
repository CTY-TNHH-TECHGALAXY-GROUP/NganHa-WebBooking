import DesignYourJourneyPage from '@/components/DesignYourJourney/DesignYourJourneyDemoPage';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata() {
  return getPageMetadata({ routeKey: 'design-your-journey', pathname: '/design-your-journey', localized: false }, {
    title: 'Design Your Journey | OriaSpa',
    description: 'Design your personalized spa journey at OriaSpa.',
  });
}

export default function Page() {
  return <DesignYourJourneyPage />;
}

import type { Metadata } from 'next';
import AdmissionFormClient from './AdmissionFormClient';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'academy/admissions', pathname: '/academy/admissions', localized: false }, {
    title: 'Recruitment / Admission | Oria Spa Academy',
    description: 'Application form for Oria Spa Academy recruitment and admissions.',
  });
}

export default function AcademyAdmissionsPage() {
  return <AdmissionFormClient />;
}

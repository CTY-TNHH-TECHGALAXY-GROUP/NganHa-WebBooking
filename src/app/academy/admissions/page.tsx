import type { Metadata } from 'next';
import AdmissionFormClient from './AdmissionFormClient';

export const metadata: Metadata = {
  title: 'Recruitment / Admission | Oria Spa Academy',
  description: 'Application form for Oria Spa Academy recruitment and admissions.',
};

export default function AcademyAdmissionsPage() {
  return <AdmissionFormClient />;
}

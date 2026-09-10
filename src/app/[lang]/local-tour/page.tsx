import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  if (lang && lang !== 'vi') {
    redirect(`/${lang}/local-tour/saigon-xua`);
  }
  redirect('/local-tour/saigon-xua');
}

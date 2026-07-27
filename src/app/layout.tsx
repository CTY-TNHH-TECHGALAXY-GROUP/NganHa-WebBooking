import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import LayoutWrapper from "@/components/LayoutWrapper";
import { TranslationProvider } from "@/components/TranslationProvider";
import { SystemSettingsProvider } from "@/components/SystemSettingsProvider";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import "./globals.css";

// 🔧 FONT CONFIGURATION
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  let seo = {
    title: "ORIA SPA | Premium Spa in District 1, HCMC",
    description:
      "Experience premium spa, barbershop, and wellness services at ORIA SPA. Located at 11 Ngo Duc Ke & 6B Thi Sach, District 1, Ho Chi Minh City. Book online now!",
    keywords:
      "spa district 1, barbershop HCMC, ORIA SPA, massage Saigon, ear cleaning spa, đặt lịch spa, spa Quận 1",
    ogImage: "https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg"
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', 'seo_config').single();
    if (data && data.value) {
      seo = { ...seo, ...data.value };
    }
  } catch (e) {
    console.error('Error reading seo.json for metadata', e);
  }

  return {
    title: seo.title,
    description: seo.description,
    keywords: Array.isArray(seo.keywords)
      ? seo.keywords
      : seo.keywords.split(',').map((k: string) => k.trim()),
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      images: [
        {
          url: seo.ogImage,
          width: 1200,
          height: 630,
          alt: seo.title
        }
      ]
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming
  viewportFit: "cover",
  themeColor: "#000000",
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  // Fetch WebBookingContent translations
  let translations = {};
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('WebBookingContent').select('key, value');
    if (data) {
      translations = data.reduce((acc: Record<string, any>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    }
  } catch (e) {
    console.error('Error fetching WebBookingContent', e);
  }

  // Fetch System Settings & About Story Media
  let systemSettings = {};
  let aboutStoryContent = {};
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs')
      .select('key, value')
      .in('key', ['system_settings', 'about_story_content']);
      
    if (data) {
      data.forEach(item => {
        if (item.key === 'system_settings') systemSettings = item.value;
        if (item.key === 'about_story_content') aboutStoryContent = item.value;
      });
    }
  } catch (e) {
    console.error('Error fetching system settings', e);
  }

  return (
    <html lang="vi" className={`${playfair.variable} ${inter.variable}`}>
      <body className="w-full min-h-full antialiased font-sans" suppressHydrationWarning>
        <SystemSettingsProvider systemSettings={systemSettings} aboutStoryContent={aboutStoryContent}>
          <TranslationProvider initialTranslations={translations}>
            <LayoutWrapper>{children}</LayoutWrapper>
          </TranslationProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  );
};

export default RootLayout;

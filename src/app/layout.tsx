import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import LayoutWrapper from "@/components/LayoutWrapper";
import { TranslationProvider } from "@/components/TranslationProvider";
import { SystemSettingsProvider } from "@/components/SystemSettingsProvider";
import AnalyticsRuntime from "@/lib/analytics/AnalyticsRuntime";
import AnalyticsConsentControl from "@/components/Analytics/AnalyticsConsentControl";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  sanitizeHomepageStyling,
  generateSanitizedCss,
  getSafeGoogleFontUrl,
} from "@/lib/config/stylingSanitizer";
import { sanitizePublicAboutStoryContent, sanitizePublicSystemSettings } from "@/lib/config/siteContentSanitizer";
import { getPageMetadata } from '@/lib/seo/metadata';
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
  const seo = await getPageMetadata({
    routeKey: 'home',
    pathname: '/',
    locale: 'vi',
    localized: true,
    defaultPathname: '/',
  }, {
    title: 'Oria Spa | Premium Spa in District 1, HCMC',
    description: 'Experience premium spa, barbershop, and wellness services at Oria Spa. Located at 11 Ngo Duc Ke, District 1, Ho Chi Minh City. Book online now!',
  });

  return {
    ...seo,
    icons: {
      icon: [
        { url: '/favicon.ico?v=3', sizes: 'any' },
        { url: '/icon-32.png?v=3', type: 'image/png', sizes: '32x32' },
        { url: '/icon-16.png?v=3', type: 'image/png', sizes: '16x16' },
      ],
      shortcut: '/favicon.ico?v=3',
      apple: [
        { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
      ],
    },
    appleWebApp: {
      title: "Oria Spa",
      statusBarStyle: "default",
      capable: true,
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming
  viewportFit: "cover",
  themeColor: "#281b15",
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
    if (e instanceof Error && !e.message.includes('Missing Supabase env vars')) console.error('Error fetching WebBookingContent', e);
  }

  // Fetch System Settings & About Story Media
  let systemSettings = {};
  let aboutStoryContent = {};
  let brandHistory: any = null;
  let homepageStyling: any = null;
  let footerContent: any = {};
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs')
      .select('key, value')
      .in('key', ['system_settings', 'about_story_content', 'brand_history', 'homepage_styling', 'homepage_content', 'footer_content', 'blog_content']);
      
    if (data) {
      data.forEach(item => {
        if (item.key === 'system_settings') systemSettings = item.value || {};
        if (item.key === 'about_story_content') aboutStoryContent = item.value;
        if (item.key === 'brand_history') brandHistory = item.value;
        if (item.key === 'homepage_styling') homepageStyling = item.value;
        if (item.key === 'homepage_content') {
           (systemSettings as any).homepage_content = item.value;
        }
        if (item.key === 'blog_content') {
           (systemSettings as any).blog_content = item.value;
        }
        if (item.key === 'footer_content') {
           footerContent = item.value || {};
        }
      });
    }
  } catch (e) {
    console.error('Error fetching system settings', e);
  }

  // Strictly sanitize homepage styling. If missing or invalid, falls back safely to default Next.js fonts without throwing or injecting raw strings.
  const sanitizedStyling = sanitizeHomepageStyling(homepageStyling);
  const publicSystemSettings = sanitizePublicSystemSettings(systemSettings);
  const publicAboutStoryContent = sanitizePublicAboutStoryContent(aboutStoryContent);
  const gFontUrl = sanitizedStyling ? getSafeGoogleFontUrl(sanitizedStyling) : null;
  const sanitizedCss = sanitizedStyling
    ? generateSanitizedCss(sanitizedStyling, {
        headingFontFamily: playfair.style.fontFamily,
        bodyFontFamily: inter.style.fontFamily,
      })
    : null;

  return (
    <html lang="vi" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" href="/icon-32.png?v=3" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon-16.png?v=3" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=3" sizes="180x180" />
        {gFontUrl && <link href={gFontUrl} rel="stylesheet" />}
        {sanitizedCss && (
          <style dangerouslySetInnerHTML={{ __html: sanitizedCss }} />
        )}
      </head>
      <body className="w-full min-h-full antialiased font-sans" suppressHydrationWarning>
        <SystemSettingsProvider systemSettings={publicSystemSettings} aboutStoryContent={publicAboutStoryContent} brandHistory={brandHistory} footerContent={footerContent}>
          <TranslationProvider initialTranslations={translations}>
            <AnalyticsRuntime />
            <AnalyticsConsentControl />
            <LayoutWrapper>{children}</LayoutWrapper>
          </TranslationProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  );
};

export default RootLayout;

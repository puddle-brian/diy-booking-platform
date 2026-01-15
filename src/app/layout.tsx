import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import FeedbackWidget from "../components/FeedbackWidget";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DIY Shows - Book Your Own Shows",
  description: "Skip the agents and middlemen. This platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.",
  keywords: "DIY music, booking platform, venues, artists, tours, shows, independent music",
  authors: [{ name: "DIY Shows" }],
  creator: "DIY Shows",
  publisher: "DIY Shows",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://diy-shows.com'),
  alternates: {
    canonical: "https://diyshows.com",
  },
  openGraph: {
    title: "DIY Shows - Book Your Own Shows",
    description: "Skip the agents and middlemen. This platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.",
    url: "https://diyshows.com",
    siteName: "DIY Shows",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DIY Shows - Book your own shows!',
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIY Shows - Book Your Own Shows",
    description: "Skip the agents and middlemen. This platform enables venues to find artists looking for shows in their area and place bids, while artists can request shows anywhere and have venues discover and bid on their tour requests.",
    images: ['/og-image.png'],
    creator: "@diyshows",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    "application-name": "DIY Shows",
    "apple-mobile-web-app-title": "DIY Shows",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#0a0a0a",
    "msapplication-tap-highlight": "no",
    "theme-color": "#0a0a0a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DIY Shows",
    "description": "Skip the agents and middlemen. Add your DIY space or act to the crowdsourced network. Book your own shows!",
    "url": "https://diy-shows.com",
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://diy-shows.com/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "Action",
        "name": "List a Space",
        "description": "Add your DIY venue to the platform",
        "target": "https://diy-shows.com/admin/venues"
      },
      {
        "@type": "Action", 
        "name": "List an Artist",
        "description": "Add your artist profile to find shows",
        "target": "https://diy-shows.com/admin/artists"
      }
    ],
    "mainEntity": {
      "@type": "WebPage",
      "@id": "https://diy-shows.com",
      "name": "DIY Shows - Book your own shows!",
      "description": "Connect DIY venues with touring artists. Skip the middlemen and book shows directly."
    },
    "sameAs": []
  };

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://diy-shows.com"
                },
                {
                  "@type": "ListItem", 
                  "position": 2,
                  "name": "Browse Venues",
                  "item": "https://diy-shows.com/?tab=venues"
                },
                {
                  "@type": "ListItem",
                  "position": 3, 
                  "name": "Browse Artists",
                  "item": "https://diy-shows.com/?tab=artists"
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "List a Space",
                  "item": "https://diy-shows.com/admin/venues"
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "name": "List an Artist", 
                  "item": "https://diy-shows.com/admin/artists"
                }
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "DIY Shows",
              "description": "DIY Shows - crowdsourced booking platform connecting venues and artists",
              "url": "https://diy-shows.com",
              "logo": "https://diy-shows.com/og-image.png",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://diy-shows.com"
              },
              "potentialAction": [
                {
                  "@type": "SearchAction",
                  "target": "https://diy-shows.com/?search={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${jetbrainsMono.variable} font-mono antialiased bg-bg-primary text-text-primary`}>
        <AuthProvider>
          {children}
          <FeedbackWidget />
        </AuthProvider>
      </body>
    </html>
  );
}

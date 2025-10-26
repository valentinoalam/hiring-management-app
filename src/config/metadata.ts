import type { Metadata } from 'next'

interface MetadataConfig {
  [key: string]: Metadata
}

const mosqueSchema = {
  "@id": "https://as-salamjs.online",
  "@context": "https://schema.org",
  "@type": ["Place","PlaceOfWorship","Mosque"],
  "name": "Masjid As-Salam Jakasampurna",
  "description": "Masjid As-Salam Jakasampurna is a mosque in Bekasi, Indonesia, serving as a place for worship and community activities.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Raya Jakasampurna IV",
    "addressLocality": "Jakasampurna",
    "addressRegion": "Bekasi",
    "postalCode": "17145",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -6.2451448,
    "longitude": 106.9695972
  },
  "url": "https://as-salamjs.online",
  "sameAs": [
    "https://www.google.com/maps/place/Masjid+As+Salam+Jakasampurna/@-6.2451448,106.9695972",
    "https://www.youtube.com/@MasjidAsSalam",
    "https://www.instagram.com/assalam_jakasampurna/"
  ],
  "telephone": "+62-21-12345678",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "04:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Friday",
      "opens": "11:00",
      "closes": "13:30",
      "description": "Friday Prayer (Jumu'ah)"
    }
  ],
  "image": "https://as-salamjs.online/images/masjid-as-salam.jpg",
  "isAccessibleForFree": true,
  "publicAccess": true,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "50"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://as-salamjs.online/search?q={search_term_string}"
    },
    "query-input": "required name=search_term"
  },
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Prayer Hall",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Ablution Facilities",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Community Events",
      "value": true
    }
  ]
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Masjid As-Salam Jakasampurna",
  "url": "https://as-salamjs.online",
  "logo": "https://as-salamjs.online/images/logo.png",
  "description": "Islamic community center and mosque in Bekasi, Indonesia",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Raya Jakasampurna IV",
    "addressLocality": "Jakasampurna",
    "addressRegion": "Bekasi",
    "postalCode": "17145",
    "addressCountry": "ID"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+62-21-12345678",
    "contactType": "customer service",
    "areaServed": "ID",
    "availableLanguage": ["Indonesian", "Arabic"]
  },
  "sameAs": [
    "https://www.youtube.com/@MasjidAsSalam",
    "https://www.instagram.com/assalam_jakasampurna/"
  ]
}

export const METADATA: MetadataConfig = {
  global: {
    title: {
      template: '%s | As-SalamJs',
      default: 'Masjid As-Salam Jakasampurna - Bekasi',
    },
    description: 'Masjid As-Salam Jakasampurna, a muslim place of worship located in Bekasi, Indonesia, offering daily prayers, Quranic education, community events, and social services. Join us for prayers, spiritual growth and community outreach.',
    keywords: ['Masjid As-Salam', 'Jakasampurna', 'Bekasi', 'mosque', 'Islam', 'prayer', 'community', 'Indonesia', 'Quran Classes', 'Muslim Community Indonesia', 'Mosque Events'],
    authors: [{ name: 'Masjid As-Salam Jakasampurna' }],
    creator: 'Masjid As-Salam Jakasampurna',
    publisher: 'Masjid As-Salam Jakasampurna',
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
    },
    openGraph: {
      title: 'Masjid As Salam Jakasampurna | Islamic Community Hub in Bekasi',
      description: 'Explore spiritual programs, daily prayers, and community services at Masjid As Salam Jakasampurna. Located in Bekasi, Indonesia.',
      url: 'https://as-salamjs.online',
      siteName: 'Masjid As-Salam Jakasampurna',
      images: [
        {
          url: 'https://as-salamjs.online/images/alquran.jpg',
          width: 1200,
          height: 630,
          alt: 'Masjid As-Salam Jakasampurna Building',
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Masjid As-Salam Jakasampurna | Community & Worship',
      description: 'Join our vibrant Islamic community in Bekasi for prayers, education, and social initiatives.',
      images: ['https://as-salamjs.online/images/alquran.jpg'],
      site: '@assalam_jakasampurna',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION || '',
    },
    alternates: {
      canonical: 'https://as-salamjs.online',
      types: {
        'application/ld+json': JSON.stringify([mosqueSchema, organizationSchema]),
      },
    },
    other: {
      'geo.region': 'ID-JB',
      'geo.placename': 'Bekasi',
      'msvalidate.01': process.env.BING_VERIFICATION || '',
    },
    formatDetection: {
      email: false,
      address: true,
      telephone: true,
    },
  },
  default: {
    title: 'Masjid As-Salam Jakasampurna',
    description: 'A welcoming mosque in Bekasi, Indonesia, offering prayer services, community events, and religious programs.',
    keywords: [
      'Itikaf',
      'Qurban',
      'Dakwah Online',
      'Mosque Bekasi',
      'Religious Activities',
      'Muslim Community',
      'Islamic Education'
    ],
    openGraph: {
      images: [
        {
          url: 'https://as-salamjs.online/images/mosque-interior.jpg',
          width: 800,
          height: 600,
          alt: 'Prayer Hall of Masjid As-Salam',
        },
      ],
    },
  },
  events: {
    title: 'Community Events | Masjid As-Salam',
    description: 'Join our upcoming community events and religious programs at Masjid As-Salam Jakasampurna.',
    keywords: ['Mosque Events', 'Community Programs', 'Islamic Lectures', 'Religious Gatherings', 'Community Activities'],
    openGraph: {
      title: 'Community Events | Masjid As-Salam Jakasampurna',
      description: 'Discover upcoming Islamic events, lectures, and community programs at our mosque in Bekasi.',
      url: 'https://as-salamjs.online/events',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/events.jpg',
          width: 1200,
          height: 630,
          alt: 'Community Events at Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/events',
    },
  },
  education: {
    title: 'Islamic Education | Masjid As-Salam',
    description: 'Quranic classes and Islamic education programs for all age groups at our Bekasi mosque.',
    keywords: ['Quran Classes', 'Islamic Education', 'Tahfidz Program', 'Religious Studies', 'Children Education'],
    openGraph: {
      title: 'Islamic Education Programs | Masjid As-Salam',
      description: 'Comprehensive Quranic education and Islamic studies for children, youth, and adults.',
      url: 'https://as-salamjs.online/education',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/education.jpg',
          width: 1200,
          height: 630,
          alt: 'Islamic Education at Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/education',
    },
  },
  articles: {
    title: 'Articles & News | Masjid As-Salam',
    description: 'Read the latest Islamic articles, news, and updates from Masjid As-Salam Jakasampurna.',
    keywords: ['Islamic Articles', 'Mosque News', 'Religious Updates', 'Community News', 'Islamic Knowledge'],
    openGraph: {
      title: 'Articles & Updates | Masjid As-Salam Jakasampurna',
      description: 'Stay informed with articles about Islamic teachings, community updates, and mosque activities.',
      url: 'https://as-salamjs.online/articles',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/articles.jpg',
          width: 1200,
          height: 630,
          alt: 'Articles from Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/articles',
    },
  },
  about: {
    title: 'About Us | Masjid As-Salam',
    description: 'Learn about the history, mission, and vision of Masjid As-Salam Jakasampurna.',
    keywords: ['About Mosque', 'History', 'Mission', 'Vision', 'Community Service'],
    openGraph: {
      title: 'About Masjid As-Salam Jakasampurna',
      description: 'Discover our mosque\'s history, mission to serve the community, and commitment to Islamic values.',
      url: 'https://as-salamjs.online/about',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/about.jpg',
          width: 1200,
          height: 630,
          alt: 'About Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/about',
    },
  },
  contact: {
    title: 'Contact Us | Masjid As-Salam',
    description: 'Get in touch with Masjid As-Salam Jakasampurna. Find our location, phone number, and contact information.',
    keywords: ['Contact Mosque', 'Location', 'Phone Number', 'Address', 'Get Directions'],
    openGraph: {
      title: 'Contact Masjid As-Salam Jakasampurna',
      description: 'Visit us or contact us for inquiries about prayer times, programs, or community services.',
      url: 'https://as-salamjs.online/contact',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/contact.jpg',
          width: 1200,
          height: 630,
          alt: 'Contact Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/contact',
    },
  },
  services: {
    title: 'Services | Masjid As-Salam',
    description: 'Explore the various services offered by Masjid As-Salam including prayers, counseling, and community support.',
    keywords: ['Mosque Services', 'Prayer Services', 'Marriage Services', 'Funeral Services', 'Counseling'],
    openGraph: {
      title: 'Services at Masjid As-Salam Jakasampurna',
      description: 'We offer comprehensive Islamic services including daily prayers, marriage ceremonies, and community support.',
      url: 'https://as-salamjs.online/services',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/services.jpg',
          width: 1200,
          height: 630,
          alt: 'Services at Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/services',
    },
  },
  prayerTimes: {
    title: 'Prayer Times | Masjid As-Salam',
    description: 'Check daily prayer times (Salah schedule) at Masjid As-Salam Jakasampurna in Bekasi.',
    keywords: ['Prayer Times', 'Salah Schedule', 'Adhan Times', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    openGraph: {
      title: 'Prayer Times | Masjid As-Salam Jakasampurna',
      description: 'Find accurate daily prayer times for Fajr, Dhuhr, Asr, Maghrib, and Isha at our mosque.',
      url: 'https://as-salamjs.online/prayer-times',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/prayer-times.jpg',
          width: 1200,
          height: 630,
          alt: 'Prayer Times at Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/prayer-times',
    },
  },
  donate: {
    title: 'Donate | Masjid As-Salam',
    description: 'Support Masjid As-Salam Jakasampurna through donations. Help us maintain our facilities and community programs.',
    keywords: ['Donate', 'Sadaqah', 'Charity', 'Support Mosque', 'Zakat', 'Infaq'],
    openGraph: {
      title: 'Donate to Masjid As-Salam Jakasampurna',
      description: 'Your donations help us serve the community better. Support our mosque and Islamic programs.',
      url: 'https://as-salamjs.online/donate',
      type: 'website',
      images: [
        {
          url: 'https://as-salamjs.online/images/donate.jpg',
          width: 1200,
          height: 630,
          alt: 'Support Masjid As-Salam',
        },
      ],
    },
    alternates: {
      canonical: 'https://as-salamjs.online/donate',
    },
  },
};
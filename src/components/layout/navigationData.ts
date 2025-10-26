import { 
  BookOpen, 
  HelpCircle, 
  Mail, 
  Share2, 
  Gift,
} from 'lucide-react';

export const defaultNavData = [
    {
      label: "Itikaf",
      href: "/itikaf",
      description: "Kisah-kisah yang menunjukkan pentingnya memiliki landing page atau website di era digital",
      icon: BookOpen
    },
    {
      label: 'FAQ',
      href: '/faq',
      description: 'Our development process'
    },
    {
      label: 'Blogs',
      href: '/blogs',
      description: 'Read our latest articles'
    },
    {
      label: 'About',
      href: '/about',
      description: 'Read our latest articles'
    },
    {
      type: 'button',
      label: 'Share',
      onClick: () => console.log('Subscribe clicked')
    }
];
export const landingPageData = [
  {
    label: "Itikaf",
    href: "/itikaf",
    description: "Kisah-kisah yang menunjukkan pentingnya memiliki landing page atau website di era digital",
    icon: BookOpen
  },
  {
    label: "Tausiah",
    href: "#",
    description: "Kenapa anda harus mencoba jasa kami",
    icon: Gift
  },
  {
    label: "FAQ",
    href: "#faq",
    description: "Hal yang sering orang tanyakan seputar jasa kami",
    icon: HelpCircle
  },
  {
    label: "Contact",
    href: "#contact",
    description: "Hubungi kami untuk memulai project anda atau jika ada yang kurang jelas",
    icon: Mail
  },
  {
    type: "button",
    label: "Share",
    onClick: () => console.log("Subscribe clicked"),
    icon: Share2
  }
];

// Optional: Additional navigation sections you might need
export const footerNavigation = [
  {
    label: 'Company',
    children: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  {
    label: 'Resources',
    children: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Support', href: '/support' },
      { label: 'Terms of Service', href: '/terms' }
    ]
  }
];

export const mobileNavigation = landingPageData.slice(0,landingPageData.length-1);
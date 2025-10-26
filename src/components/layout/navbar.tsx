'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from "next/navigation";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
// import Logo from '../Logo';
import { mobileNavigation, defaultNavData, landingPageData } from './navigationData';
import { NavItem, NavLink } from './navigationMenu';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import useScrollContext from '@/hooks/useScrollTracking';
import { Button } from '../ui/button';
import Image from 'next/image';
gsap.registerPlugin(ScrollTrigger);


const NavigationMenu = dynamic(() => import("./navigationMenu"), {})
// const DockNavigation = dynamic(() => import("./dockNav"), {
//   ssr: false,
// })
export function Navbar() {
  const {isScrolled} = useScrollContext();
  const pathname = usePathname();
  const isDefaultRoute = pathname === "/";
  const navigationData = isDefaultRoute ? landingPageData : defaultNavData;
  const [isOpen, setIsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const ctx = useRef<gsap.Context | null>(null);
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);
   // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial animation
  useEffect(() => {
    ctx.current = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -100 },
        { 
          y: 0, 
          duration: 0.6, 
          ease: 'power2.out'
        }
      );

      gsap.fromTo(
        '.logo-container',
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 0.6, 
          delay: 0.3,
          ease: 'power2.out'
        }
      );
  }, navRef); // Scope the context to the section
  
  return () => {
    ctx.current?.revert();
    ctx.current = null;
  };
  }, []);

  // Mobile menu animation
  useEffect(() => {
    let ctx: gsap.Context | null = null; // Initialize as null
    if (mobileMenuRef.current) {
      ctx = gsap.context(() => {
        gsap.set(mobileMenuRef.current, {
          display: isOpen ? 'block' : 'none',
        });
        
        if (isOpen) {
          gsap.fromTo(
            mobileMenuRef.current,
            { 
              opacity: 0,
              y: -20 
            },
            { 
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: 'power2.out'
            }
          );
        }
      });
    }
    return () => {
      ctx?.revert(); // Safe cleanup with optional chaining
    };
  }, [isOpen]);
  
  const renderDesktopNav = () => (
    <header
      ref={navRef}
      className={cn(
        "w-full z-50 transition-all duration-300 bg-gradient-to-b from-[#D4EFDA]",
        isMobile && isScrolled? 'fixed to-background/30 backdrop-blur-md shadow-md' : 'relative to-transparent',
        // isOut1stScreen && 'block md:hidden'
      )}
    >
      <div className="container mx-auto px-8 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 logo-container">
            <Link href="/" className="text-xl font-bold">
              {/* <Logo /> */}
              <div className="w-20 h-10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Company logo"
                  width={120} // Matches w-[84px]
                  height={120} // Approximate for h-9 (9 * 4 = 36px)
                  className="w-[84px] h-16 object-contain"
                />
              </div>
            </Link>
          </div>

          <NavigationMenu 
            items={navigationData as NavItem[]} 
            className="hidden md:flex items-center gap-4"
          />

          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </header>
  );
  const renderMobileMenu = () => (
    <div
      ref={mobileMenuRef}
      className={cn(
        isOpen ? 'opacity-100 z-30 h-screen' : 'opacity-0 z-0 h-0',
        "fixed top-16 left-0 right-0 bg-[#D4EFDA]/95 backdrop-blur-md shadow-lg transform transition-all duration-300 ease-in-out md:hidden"
      )}
      style={{ transform: isOpen ? 'translateY(0)' : 'translateY(-110%)' }}
    >
      <div className="px-4 py-6 space-y-4">
        {mobileNavigation.map((item) => (
          <MobileNavLink 
            key={item.href || item.label} 
            href={item.href as string}
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </MobileNavLink>
        ))}
      </div>
    </div>
  );
  // const renderFloatingDock = () => ( isScrolled && <DockNavigation isDefaultRoute={isDefaultRoute} /> );

  return (
    <>
    { renderDesktopNav() } 
    { isMobile && renderMobileMenu() }
    {/* { !isMobile && renderFloatingDock() } */}
    </>
  );
}



function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode, onClick?: () => void }) {
  return (
    <NavLink
      href={href} onClick={onClick}
      className="block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md text-foreground/70 hover:text-foreground hover:bg-foreground/10"
    >
      {children}
    </NavLink>
  );
}
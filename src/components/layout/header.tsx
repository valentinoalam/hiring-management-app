'use client';

import { usePathname } from "next/navigation";
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react"; // 💡 Import useSession and signOut
import { LogOut, Loader2, User as UserIcon } from "lucide-react"; // Added Lucide icons for better UX
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import React from 'react';

export default function Header() {
  const { data: session, status } = useSession(); // 💡 Fetch session data and status
  const pathname = usePathname()
  // ✅ Detect if this layout is on recruiter section
  const isRecruiterPage = pathname.startsWith('/recruiter')

  // Optionally refine: hide header only on dashboard root or login
  const hideHeaderOn = ['/recruiter']
  const showBreadcrumb = isRecruiterPage && !hideHeaderOn.includes(pathname)
  // Filter(Boolean) removes empty strings (e.g., from leading or trailing '/')
  const pathSegments = pathname.split("/").filter(Boolean) 

  // Use a temporary user object based on the Session structure defined in next-auth.d.ts
  const user = session?.user;
  const isAuthenticated = status === 'authenticated';

  // --- Breadcrumb Rendering Logic ---
  const renderBreadcrumbs = () => {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="../">Back</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {pathSegments.map((segment, index) => {
            const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
            const displaySegment = segment
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            const isLast = index === pathSegments.length - 1;
            
            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem >
                  {isLast ? (
                    <BreadcrumbPage className="block border my-1 px-2 h-8 content-center border-neutral-50 bg-neutral-30 rounded-xl">{displaySegment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className="border my-1 px-2 h-8 block content-center border-neutral-40 bg-neutral-10 rounded-xl" asChild>
                      <Link href={href}>{displaySegment}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  
  // --- Profile Dropdown Rendering Logic ---
  const renderProfileDropdown = () => {
    if (status === 'loading') {
      return (
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        // Show a sign in button if not authenticated
        <Link href="/login" passHref>
          <Button variant="default">Sign In</Button>
        </Link>
      );
    }
    console.log(isAuthenticated)
    console.log(user.fullName)
    const initials = user.fullName
      ? user.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
      : ""; // Fallback for when user.fullName is undefined or null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {/* 💡 Use session.user.image */}
              <AvatarImage src={user.image ?? undefined} alt={user.fullName} /> 
              {/* 💡 Use session.user.fullName initials */}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {/* 💡 Use session.user.fullName */}
              <p className="text-sm font-medium leading-none">{user.fullName}</p> 
              {/* 💡 Use session.user.email */}
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* 💡 Connect Log out to NextAuth signOut function */}
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="cursor-pointer text-red-500 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  

  return (
    <header className="h-16 border-neutral-40 sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* 💡 Left side: Breadcrumbs */}
        {showBreadcrumb ?
        <div className="flex items-center">
          {renderBreadcrumbs()}
        </div> :
        <div className="flex items-center py-2.5">
          <h1 className="text-lg font-bold leading-7 text-[#1E1F21]">
            Job List
          </h1>
        </div>
        }
        

        
        {/* 💡 Right side: Profile Dropdown */}
        <div className="flex items-center self-justify-end gap-4">
          {renderProfileDropdown()}
        </div>
      </div>
    </header>
  );
}
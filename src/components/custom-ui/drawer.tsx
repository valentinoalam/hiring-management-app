import { X, PanelLeft } from 'lucide-react';
import React from 'react'

function drawer({isOpen, toggleDrawer, children}:{
  isOpen: boolean,
  toggleDrawer: () => void,
  children: React.ReactNode
}) {
  
  // --- Button Classes (The "Bubble Gum" Sticky Trigger) ---

  // Base classes for the fixed, half-rounded button
  const buttonBaseClasses =
    'fixed z-[100] text-primary shadow-lg transition-all duration-300 ease-in-out cursor-pointer ' +
    'bg-neutral-10 hover:bg-neutral-30 hover:border-neutral-60 hover:border active:bg-neutral-60';

  // Desktop (lg+) position and shape: Sticky left side, rounded on the right
  const buttonDesktopClasses = 
    'hidden lg:block lg:left-0 py-3 lg:top-1/3 px-1 lg:transform lg:-translate-y-1/2 lg:rounded-r-full';

  // Mobile (sm/md) position and shape: Sticky top center, rounded on the bottom
  const buttonMobileClasses = 
    'block lg:hidden top-10 left-1/2 px-3 py-1 transform -translate-x-1/2 rounded-full';

  // --- Drawer Classes (The Sliding Panel) ---

  // Base classes for the fixed, full-screen overlay/drawer
  const drawerBaseClasses =
    'fixed bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto';

  // Desktop (lg+) drawer size and animation: Slides from the left
  const drawerDesktopClasses =
    'hidden lg:block h-full w-80 top-0 left-0';
  const drawerDesktopTransform = isOpen ? 'translate-x-0' : '-translate-x-full';

  // Mobile (sm/md) drawer size and animation: Slides from the top
  const drawerMobileClasses =
    'block lg:hidden w-full h-3/5 top-0 left-0 rounded-b-2xl';
  const drawerMobileTransform = isOpen ? 'translate-y-0' : '-translate-y-full';

  return (
    <>
      {/* 1. Backdrop Overlay (Visible only when open on mobile/small screens) */}
      {isOpen && (
          <div
            className="fixed inset-0 bg-black opacity-40 z-40 lg:hidden"
            onClick={toggleDrawer}
          ></div>
        )}

        {/* 2. Responsive Toggle Button (Bubble Gum Stick) */}
        <div 
          onClick={toggleDrawer} 
          aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
          className={`${buttonBaseClasses} ${buttonDesktopClasses}`}
        >
          {isOpen ? <X size={24} /> : <PanelLeft size={24} />}
        </div>
        
        <div 
          onClick={toggleDrawer} 
          aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
          className={`${buttonBaseClasses} ${buttonMobileClasses}`}
        >
          {isOpen ? <X size={24} /> : <PanelLeft size={24} />}
        </div>

        {/* 3. Responsive Drawer Panel */}

        {/* Desktop Drawer */}
        <div 
          className={`${drawerBaseClasses} ${drawerDesktopClasses} transform ${drawerDesktopTransform}`}
        >
          <div className="flex justify-end p-2 lg:hidden">
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
              </button>
          </div>
          {children}
        </div>
        {/* Mobile Drawer */}
        <div 
          className={`${drawerBaseClasses} ${drawerMobileClasses} transform ${drawerMobileTransform}`}
        >
          <div className="flex justify-end p-4">
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
              </button>
          </div>
          {children}
        </div>

    </>
  )
}

export default drawer
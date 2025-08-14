'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface NavbarVisibilityContextType {
  isNavbarHidden: boolean
  hideNavbar: () => void
  showNavbar: () => void
}

const NavbarVisibilityContext = createContext<NavbarVisibilityContextType | undefined>(undefined)

export function NavbarVisibilityProvider({ children }: { children: ReactNode }) {
  const [isNavbarHidden, setIsNavbarHidden] = useState(false)

  const hideNavbar = () => {
    console.log('🔄 Hiding navbar')
    setIsNavbarHidden(true)
  }

  const showNavbar = () => {
    console.log('🔄 Showing navbar')
    setIsNavbarHidden(false)
  }

  return (
    <NavbarVisibilityContext.Provider value={{ isNavbarHidden, hideNavbar, showNavbar }}>
      {children}
    </NavbarVisibilityContext.Provider>
  )
}

export function useNavbarVisibility() {
  const context = useContext(NavbarVisibilityContext)
  if (context === undefined) {
    throw new Error('useNavbarVisibility must be used within a NavbarVisibilityProvider')
  }
  return context
} 
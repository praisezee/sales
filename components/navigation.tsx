"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { BarChart3, TrendingUp, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    {
      href: "/",
      label: "Daily Tracker",
      icon: BarChart3,
      description: "Track today's sales",
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "View historical data",
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 animate-slide-in-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center hover-lift">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SalesTracker
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 transition-all duration-300 touch-action hover-lift",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg animate-glow"
                        : "hover:bg-accent/50 hover:scale-105",
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-2">
            <div className="animate-scale-in" style={{ animationDelay: "0.3s" }}>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden touch-action hover:scale-105 transition-transform duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="relative w-5 h-5">
                <Menu
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMobileMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
                  )}
                />
              </div>
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-slide-up">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 touch-action hover-lift animate-fade-in-up",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "hover:bg-accent/50 active:bg-accent/70",
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-sm opacity-70 truncate">{item.description}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}

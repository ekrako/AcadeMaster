'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';

const allNavigationItems = [
  { href: '/', label: 'בית', icon: '🏠' },
  { href: '/hour-types', label: 'סוגי שעות', icon: '⏰', requiresAuth: true },
  { href: '/scenarios', label: 'תרחישים', icon: '📋', requiresAuth: true },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Filter navigation items based on auth status
  const navigationItems = allNavigationItems.filter(item => 
    !item.requiresAuth || user
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            AcadeMaster
          </Link>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex space-x-reverse space-x-4 lg:space-x-6">
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg sm:text-base">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Mobile menu - simplified navigation */}
            <div className="flex sm:hidden space-x-reverse space-x-2">
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.label}
                >
                  <span className="text-lg">{item.icon}</span>
                </Link>
              ))}
            </div>
            
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
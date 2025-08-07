import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, History, Briefcase, DollarSign, Settings, LogOut, Building } from 'lucide-react';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { useUserManagement } from '@/hooks/useUserManagement';

interface NavigationProps {
  currentView: 'invoice' | 'clients' | 'services' | 'history' | 'pending' | 'pending-form' | 'expenses' | 'companies';
  onViewChange: (view: 'invoice' | 'clients' | 'services' | 'history' | 'pending' | 'pending-form' | 'expenses' | 'companies') => void;
  onLogout: () => void;
}

export default function Navigation({ currentView, onViewChange, onLogout }: NavigationProps) {
  const { t, language, changeLanguage, availableLanguages, isRTL } = useLanguage();
  const { isAdmin } = useUserManagement();

  const navItems = [
    { key: 'invoice', icon: FileText, label: t.createInvoice },
    { key: 'pending-form', icon: FileText, label: 'Quick Invoice' },
    { key: 'clients', icon: Users, label: t.clientManagement },
    { key: 'services', icon: Briefcase, label: t.serviceManagement },
    { key: 'history', icon: History, label: t.invoiceHistory },
    { key: 'pending', icon: History, label: t.pendingInvoices },
    { key: 'expenses', icon: DollarSign, label: t.expenseManagement },
  ];

  // Users are now managed per company, not globally
  
  // Add company management
  navItems.push({ key: 'companies', icon: Building, label: t.companyManagement });

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant={currentView === item.key ? 'default' : 'outline'}
                onClick={() => onViewChange(item.key as any)}
                className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} ${
                  currentView === item.key ? 'bg-primary hover:bg-primary/90' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {item.label}
              </Button>
            );
          })}
        </div>
        
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
          {/* Language Selector */}
          <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    {lang.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={onLogout}
            className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.logout}
          </Button>
        </div>
      </div>
    </div>
  );
}

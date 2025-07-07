import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, History } from 'lucide-react';
import { translations } from '../utils/translations';

interface NavigationProps {
  currentView: 'invoice' | 'clients' | 'history';
  onViewChange: (view: 'invoice' | 'clients' | 'history') => void;
  language: 'de' | 'en' | 'he' | 'fr';
  onLanguageChange: (language: 'de' | 'en' | 'he' | 'fr') => void;
}

export default function Navigation({ currentView, onViewChange, language, onLanguageChange }: NavigationProps) {
  const t = translations[language];

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={currentView === 'invoice' ? 'default' : 'outline'}
            onClick={() => onViewChange('invoice')}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t.generateInvoice}
          </Button>
          <Button
            variant={currentView === 'clients' ? 'default' : 'outline'}
            onClick={() => onViewChange('clients')}
            className="flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            {t.clients}
          </Button>
          <Button
            variant={currentView === 'history' ? 'default' : 'outline'}
            onClick={() => onViewChange('history')}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            {t.invoiceHistory}
          </Button>
        </div>
        
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="he">עברית</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
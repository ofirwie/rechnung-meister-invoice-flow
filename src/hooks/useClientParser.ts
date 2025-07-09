import { useState } from 'react';
import { ClientFormData } from '../types/client';
import { supabase } from '@/integrations/supabase/client';

export function useClientParser() {
  const [pasteText, setPasteText] = useState('');

  const parseClientInfo = async (text: string): Promise<Partial<ClientFormData>> => {
    if (!text.trim()) return {};

    // Basic regex parsing
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
    const phoneRegex = /[\+]?[\d\-\(\)\s]{10,}/;

    let parsedData: Partial<ClientFormData> = {};

    // Extract email
    const emailMatch = text.match(emailRegex);
    if (emailMatch) parsedData.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) parsedData.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();

    // Use OpenAI via Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('parse-client-info', {
        body: { text }
      });

      if (!error && data) {
        parsedData = { ...parsedData, ...data };
      }
    } catch (error) {
      console.error('AI parsing failed, using basic parsing:', error);
    }

    // Basic parsing fallback
    if (!parsedData.companyName) {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) parsedData.companyName = lines[0].trim();
    }

    return Object.fromEntries(
      Object.entries(parsedData).filter(([_, value]) => value && value.toString().trim())
    );
  };

  const resetPasteText = () => setPasteText('');

  return {
    pasteText,
    setPasteText,
    parseClientInfo,
    resetPasteText
  };
}
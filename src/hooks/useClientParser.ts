import { useState } from 'react';
import { ClientFormData } from '../types/client';

export function useClientParser() {
  const [pasteText, setPasteText] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');

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

    // Use OpenAI if key is provided
    if (openAiKey && openAiKey.trim()) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Extract client information from the given text and return a JSON object with these fields: companyName, contactName, address, city, postalCode, email, phone, taxId. Only include fields that are clearly identifiable. Return only valid JSON.'
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.1,
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResult = JSON.parse(data.choices[0].message.content);
          parsedData = { ...parsedData, ...aiResult };
        }
      } catch (error) {
        console.error('OpenAI parsing failed, using basic parsing:', error);
      }
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
    openAiKey,
    setOpenAiKey,
    parseClientInfo,
    resetPasteText
  };
}
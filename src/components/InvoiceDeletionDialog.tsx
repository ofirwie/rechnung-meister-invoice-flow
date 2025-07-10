import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield } from 'lucide-react';

interface InvoiceDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceNumber: string;
  invoiceStatus: string;
  language: 'de' | 'en';
}

export default function InvoiceDeletionDialog({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  invoiceStatus,
  language
}: InvoiceDeletionDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [reasonText, setReasonText] = useState('');
  
  const requiredText = language === 'de' ? 'LÖSCHEN' : 'DELETE';
  const canDelete = confirmationText === requiredText && 
                   reasonText.trim().length > 10 && 
                   invoiceStatus === 'draft';

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      setConfirmationText('');
      setReasonText('');
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setReasonText('');
    onClose();
  };

  // If invoice is approved or issued, show error dialog
  if (invoiceStatus === 'approved' || invoiceStatus === 'issued') {
    return (
      <AlertDialog open={isOpen} onOpenChange={handleClose}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <AlertDialogTitle className="text-red-800 text-xl">
                {language === 'de' ? 'Löschung nicht erlaubt!' : 'Deletion Not Allowed!'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">
                      {language === 'de' ? 'Kritischer Verstoß' : 'Critical Violation'}
                    </h4>
                    <p className="text-red-700">
                      {language === 'de' 
                        ? `Rechnung ${invoiceNumber} hat den Status "${invoiceStatus}" und darf NIEMALS gelöscht werden.`
                        : `Invoice ${invoiceNumber} has status "${invoiceStatus}" and must NEVER be deleted.`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  {language === 'de' ? 'Rechtliche Konsequenzen:' : 'Legal Consequences:'}
                </h4>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• {language === 'de' ? 'Verstoß gegen Buchführungsgesetze' : 'Violation of accounting laws'}</li>
                  <li>• {language === 'de' ? 'Steuerhinterziehung' : 'Tax evasion'}</li>
                  <li>• {language === 'de' ? 'Geldstrafen bis zu €50,000' : 'Fines up to €50,000'}</li>
                  <li>• {language === 'de' ? 'Mögliche Gefängnisstrafe' : 'Possible imprisonment'}</li>
                  <li>• {language === 'de' ? 'Verlust der Geschäftslizenz' : 'Loss of business license'}</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {language === 'de' ? 'Was bei Fehlern zu tun ist:' : 'What to do if there are errors:'}
                </h4>
                <p className="text-blue-700 text-sm">
                  {language === 'de' 
                    ? 'Erstellen Sie eine Stornorechnung oder Kreditnota. Kontaktieren Sie Ihren Steuerberater.'
                    : 'Create a cancellation invoice or credit note. Contact your tax advisor.'}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>
              {language === 'de' ? 'Verstanden' : 'Understood'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <AlertDialogTitle className="text-yellow-800 text-xl">
              {language === 'de' ? 'Rechnung löschen' : 'Delete Invoice'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                {language === 'de' 
                  ? `Sie sind dabei, Rechnung ${invoiceNumber} zu löschen.`
                  : `You are about to delete invoice ${invoiceNumber}.`}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  {language === 'de' ? 'Grund für die Löschung (mindestens 10 Zeichen):' : 'Reason for deletion (minimum 10 characters):'}
                </Label>
                <Input
                  id="reason"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder={language === 'de' ? 'Detaillierte Begründung...' : 'Detailed justification...'}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reasonText.length}/10 {language === 'de' ? 'Zeichen erforderlich' : 'characters required'}
                </p>
              </div>

              <div>
                <Label htmlFor="confirm" className="text-sm font-medium">
                  {language === 'de' 
                    ? `Geben Sie "${requiredText}" ein, um zu bestätigen:`
                    : `Type "${requiredText}" to confirm:`}
                </Label>
                <Input
                  id="confirm"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={requiredText}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">
                {language === 'de' 
                  ? 'Diese Aktion wird in den Audit-Logs gespeichert und kann nicht rückgängig gemacht werden.'
                  : 'This action will be logged in the audit logs and cannot be undone.'}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!canDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            {language === 'de' ? 'Endgültig löschen' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
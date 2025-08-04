import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Bug, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DebugData {
  renderCount: number;
  triggerSource: string;
  componentState: any;
  timestamp: string;
}

interface DebugModalProps {
  renderCount: number;
  triggerSource: string;
  componentState: any;
}

export const DebugModal: React.FC<DebugModalProps> = ({
  renderCount,
  triggerSource,
  componentState
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugSnapshot, setDebugSnapshot] = useState<DebugData | null>(null);

  // Create debug snapshot when modal opens
  const takeSnapshot = useCallback(() => {
    const snapshot: DebugData = {
      renderCount,
      triggerSource,
      componentState: JSON.parse(JSON.stringify(componentState)), // Deep copy
      timestamp: new Date().toISOString()
    };
    setDebugSnapshot(snapshot);
  }, [renderCount, triggerSource, componentState]);

  const openModal = useCallback(() => {
    takeSnapshot();
    setIsOpen(true);
  }, [takeSnapshot]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const refreshSnapshot = useCallback(() => {
    takeSnapshot();
    toast.success('Debug data refreshed');
  }, [takeSnapshot]);

  const copyDebugInfo = useCallback(async () => {
    if (!debugSnapshot) return;

    const debugReport = {
      timestamp: debugSnapshot.timestamp,
      renderCount: debugSnapshot.renderCount,
      triggerSource: debugSnapshot.triggerSource,
      componentState: debugSnapshot.componentState,
      analysis: {
        status: debugSnapshot.renderCount > 50 ? 'CRITICAL' : 
                debugSnapshot.renderCount > 10 ? 'WARNING' : 'NORMAL',
        recommendations: []
      }
    };

    if (debugSnapshot.renderCount > 50) {
      debugReport.analysis.recommendations.push('Infinite render loop detected - check useEffect dependencies');
    }
    if (debugSnapshot.renderCount > 10) {
      debugReport.analysis.recommendations.push('High render count - look for unnecessary re-renders');
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2));
      toast.success('Debug report copied to clipboard');
    } catch (error) {
      console.error('Failed to copy debug report:', error);
      toast.error('Failed to copy debug report');
    }
  }, [debugSnapshot]);

  const getStatusColor = (count: number) => {
    if (count < 10) return 'bg-green-500';
    if (count < 25) return 'bg-yellow-500';
    if (count < 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (count: number) => {
    if (count < 10) return 'Normal';
    if (count < 25) return 'High';
    if (count < 50) return 'Critical';
    return 'INFINITE';
  };

  // Floating debug button
  const debugButton = (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={openModal}
        variant="outline"
        size="sm"
        className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg border-blue-600"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug ({renderCount})
      </Button>
    </div>
  );

  // Modal content
  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <Card className="relative w-96 max-h-[80vh] overflow-hidden bg-white shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(debugSnapshot?.renderCount || 0)}`} />
              Debug Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeModal}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {debugSnapshot ? (
            <>
              {/* Status Overview */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Render Count</div>
                  <div className="text-lg font-bold">{debugSnapshot.renderCount}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Status</div>
                  <Badge 
                    variant={debugSnapshot.renderCount > 50 ? 'destructive' : 
                            debugSnapshot.renderCount > 10 ? 'secondary' : 'default'}
                  >
                    {getStatusText(debugSnapshot.renderCount)}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <div className="font-medium">Last Trigger</div>
                  <div className="text-sm">{debugSnapshot.triggerSource}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshSnapshot}
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDebugInfo}
                  className="flex-1"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Report
                </Button>
              </div>

              {/* Warnings */}
              {debugSnapshot.renderCount > 10 && (
                <div className="bg-red-50 border border-red-200 p-2 rounded">
                  <div className="font-medium text-red-800 text-sm mb-1">
                    ⚠️ Issues Detected:
                  </div>
                  {debugSnapshot.renderCount > 50 && (
                    <div className="text-xs text-red-700 mb-1">
                      • Infinite render loop detected
                    </div>
                  )}
                  {debugSnapshot.renderCount > 10 && (
                    <div className="text-xs text-red-700 mb-1">
                      • High render count - check for unnecessary re-renders
                    </div>
                  )}
                </div>
              )}

              {/* Component State Preview */}
              <div>
                <div className="font-medium text-sm mb-2">Component State:</div>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  <pre>{JSON.stringify(debugSnapshot.componentState, null, 2)}</pre>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center">
                Snapshot taken: {new Date(debugSnapshot.timestamp).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              Loading debug data...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : null;

  return (
    <>
      {debugButton}
      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

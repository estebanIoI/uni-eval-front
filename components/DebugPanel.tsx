/**
 * Panel de Debug para visualizar logs en desarrollo
 * Solo se muestra en modo development
 */

"use client";

import { useEffect, useState } from 'react';
import { logger } from '@/src/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: any;
}

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs().slice(-20).reverse());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isDevelopment) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'default';
      case 'INFO': return 'secondary';
      case 'DEBUG': return 'outline';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="Toggle Debug Panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-96 overflow-auto p-4 bg-white shadow-2xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🔍 Debug Logs</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  logger.clearLogs();
                  setLogs([]);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const exported = logger.exportLogs();
                  navigator.clipboard.writeText(exported);
                  alert('Logs copiados al portapapeles');
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-500">No hay logs disponibles</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getLevelColor(log.level) as any}>
                      {log.level}
                    </Badge>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.context && (
                    <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </>
  );
}

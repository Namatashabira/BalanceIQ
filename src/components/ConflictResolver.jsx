import React from 'react';
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react';

export default function ConflictResolver({ 
  conflicts, 
  onResolve, 
  onForceSync, 
  isVisible 
}) {
  if (!isVisible || conflicts.length === 0) return null;

  const formatValue = (value, type) => {
    if (type === 'number' && value !== null && value !== undefined) {
      return new Intl.NumberFormat().format(value);
    }
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    return value || '';
  };

  const resolveConflict = (conflictId, useLocal) => {
    onResolve(conflictId, useLocal ? 'local' : 'server');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b bg-yellow-50">
          <AlertTriangle className="text-yellow-600" size={20} />
          <h3 className="text-lg font-semibold text-yellow-800">
            Sync Conflicts Detected
          </h3>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-160px)] overflow-y-auto">
          <p className="text-gray-600">
            The following items have been modified both locally and on the server. 
            Please choose which version to keep for each conflict.
          </p>

          {conflicts.map((conflict, index) => (
            <div key={conflict.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">
                  Conflict #{index + 1} - Item ID: {conflict.id}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveConflict(conflict.id, true)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    <Check size={14} />
                    Use Local
                  </button>
                  <button
                    onClick={() => resolveConflict(conflict.id, false)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    <Check size={14} />
                    Use Server
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Local Version */}
                <div className="border rounded p-3 bg-blue-50">
                  <h5 className="font-medium text-blue-700 mb-2">Local Version</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(conflict.local).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-mono">{formatValue(value, 'text')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Version */}
                <div className="border rounded p-3 bg-green-50">
                  <h5 className="font-medium text-green-700 mb-2">Server Version</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(conflict.server).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-mono">{formatValue(value, 'text')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Differences Highlight */}
              <div className="mt-3 p-2 bg-yellow-100 rounded">
                <h6 className="text-sm font-medium text-yellow-800 mb-1">Differences:</h6>
                <div className="text-sm text-yellow-700">
                  {Object.keys(conflict.local).filter(key => 
                    conflict.local[key] !== conflict.server[key]
                  ).map(key => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium">{key}:</span>
                      <span className="bg-blue-200 px-1 rounded">
                        Local: {formatValue(conflict.local[key], 'text')}
                      </span>
                      <span>vs</span>
                      <span className="bg-green-200 px-1 rounded">
                        Server: {formatValue(conflict.server[key], 'text')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} remaining
          </div>
          <div className="flex gap-2">
            <button
              onClick={onForceSync}
              className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              title="Override server data with local changes"
            >
              <RefreshCw size={16} />
              Force Sync (Use All Local)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
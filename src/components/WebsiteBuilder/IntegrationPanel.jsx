import { Package, DollarSign, FileText, CheckCircle, XCircle } from 'lucide-react';

const integrations = [
  { id: 'inventory', name: 'Inventory System', icon: Package, status: 'connected', description: 'Sync product stock levels' },
  { id: 'sales', name: 'Sales Tracking', icon: DollarSign, status: 'connected', description: 'Track orders and revenue' },
  { id: 'accounting', name: 'Accounting', icon: FileText, status: 'disconnected', description: 'Financial data integration' },
];

export default function IntegrationPanel({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-xl font-bold">Integrations</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            const isConnected = integration.status === 'connected';
            
            return (
              <div key={integration.id} className="border rounded-lg p-4 flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Icon size={24} className="text-gray-700" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{integration.name}</h3>
                    {isConnected ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                  
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      isConnected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

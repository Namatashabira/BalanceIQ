import { X } from 'lucide-react';

const templates = [
  { id: 1, name: 'Modern Store', preview: '/api/placeholder/300/200', category: 'ecommerce' },
  { id: 2, name: 'Minimal Shop', preview: '/api/placeholder/300/200', category: 'ecommerce' },
  { id: 3, name: 'Agriculture Pro', preview: '/api/placeholder/300/200', category: 'agriculture' },
  { id: 4, name: 'Farm Fresh', preview: '/api/placeholder/300/200', category: 'agriculture' },
];

export default function TemplateGallery({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Choose a Template</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
            >
              <div className="bg-gray-200 h-40 flex items-center justify-center">
                <span className="text-gray-500">{template.name}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{template.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

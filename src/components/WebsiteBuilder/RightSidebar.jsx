import { ChevronRight } from 'lucide-react';

export default function RightSidebar({ selectedElement, onUpdateElement, isOpen, onToggle }) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-12 bg-white border-l border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
        title="Open settings"
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>
    );
  }

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Settings</h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded transition"
            title="Close sidebar"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
        <p className="text-gray-400 text-center flex-1 flex items-center justify-center">
          Select an element to edit
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    onUpdateElement({ ...selectedElement, [field]: value });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
        <h3 className="font-semibold text-gray-700">Settings</h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded transition"
          title="Close sidebar"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="p-6 space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <input
            type="text"
            value={selectedElement.type}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
          />
        </div>

        {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
          </div>
        )}

        {selectedElement.type === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              type="text"
              value={selectedElement.src || ''}
              onChange={(e) => handleChange('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="https://..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedElement.bgColor || '#ffffff'}
              onChange={(e) => handleChange('bgColor', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedElement.bgColor || '#ffffff'}
              onChange={(e) => handleChange('bgColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedElement.textColor || '#000000'}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedElement.textColor || '#000000'}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              value={selectedElement.padding || 16}
              onChange={(e) => handleChange('padding', e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12">{selectedElement.padding || 16}px</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              value={selectedElement.margin || 0}
              onChange={(e) => handleChange('margin', e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12">{selectedElement.margin || 0}px</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
          <select
            value={selectedElement.width || 'full'}
            onChange={(e) => handleChange('width', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="third">One Third</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
          <select
            value={selectedElement.textAlign || 'left'}
            onChange={(e) => handleChange('textAlign', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Trash2, Copy } from 'lucide-react';

export default function CanvasEditor({
  elements,
  onDrop,
  onSelectElement,
  selectedElement,
  onDeleteElement,
  onDuplicateElement,
  renderHeroBanner,
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onDrop(e);
  };

  const getElementStyle = (element) => {
    return {
      backgroundColor: element.bgColor || '#ffffff',
      color: element.textColor || '#000000',
      padding: `${element.padding || 16}px`,
      margin: `${element.margin || 0}px`,
      textAlign: element.textAlign || 'left',
    };
  };

  const renderElement = (element) => {
    const isSelected = selectedElement?.id === element.id;
    const baseClass = `relative rounded cursor-pointer transition border-2 ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
    }`;

    const elementStyle = getElementStyle(element);

    // Render hero banners
    if (element.type === 'hero-banner') {
      return renderHeroBanner(element);
    }

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            className={baseClass}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <p className="text-gray-800 break-words">{element.content || 'Text content'}</p>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div
            key={element.id}
            className={baseClass}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <div className="bg-gray-200 h-40 flex items-center justify-center rounded overflow-hidden">
              {element.src ? (
                <img src={element.src} alt="Element" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500">Image</span>
              )}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      case 'button':
        return (
          <div
            key={element.id}
            className={baseClass}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <button className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
              {element.content || 'Button'}
            </button>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      case 'product':
        return (
          <div
            key={element.id}
            className={baseClass}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="bg-gray-200 h-32 mb-3 rounded flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <h4 className="font-semibold text-sm text-gray-800 mb-1">{element.content || 'Product Name'}</h4>
              <p className="text-green-600 font-bold text-lg">$0.00</p>
              <button className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Add to Cart
              </button>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      case 'section':
        return (
          <div
            key={element.id}
            className={`${baseClass} min-h-32`}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <div className="text-gray-600 font-semibold mb-2">{element.content || 'Section'}</div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      case 'grid':
        return (
          <div
            key={element.id}
            className={baseClass}
            style={elementStyle}
            onClick={() => onSelectElement(element)}
          >
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 h-24 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Column {i}</span>
                </div>
              ))}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicateElement(element.id); }}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteElement(element.id); }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-auto transition-colors ${
        dragOver ? 'bg-blue-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-5xl mx-auto">
        {/* Canvas */}
        <div className="bg-white min-h-[800px] shadow-2xl rounded-lg p-8 space-y-4">
          {elements.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-gray-400">
              <p className="text-lg font-medium mb-2">Your website canvas</p>
              <p className="text-sm">Drag components or blocks from the left sidebar to start building</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elements.map(renderElement)}
            </div>
          )}
        </div>

        {/* Canvas info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Canvas: {elements.length} element{elements.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}

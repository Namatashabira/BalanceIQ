import { Bold, Italic, Type, Palette, X } from 'lucide-react';
import { useState } from 'react';

export default function TextEditorToolbar({ position, onClose, onApplyStyle, selectedText }) {
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('transparent');

  const handleApply = (styleType, value) => {
    onApplyStyle({ type: styleType, value, text: selectedText });
  };

  if (!position) return null;

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-50 w-80"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Text Styling</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Font Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="8"
            max="100"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              handleApply('fontSize', e.target.value);
            }}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-12">{fontSize}px</span>
        </div>
      </div>

      {/* Text Styling Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setIsBold(!isBold);
            handleApply('bold', !isBold);
          }}
          className={`flex-1 p-2 rounded transition flex items-center justify-center gap-2 ${
            isBold
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Bold size={18} />
          <span className="text-sm font-medium">Bold</span>
        </button>
        <button
          onClick={() => {
            setIsItalic(!isItalic);
            handleApply('italic', !isItalic);
          }}
          className={`flex-1 p-2 rounded transition flex items-center justify-center gap-2 ${
            isItalic
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Italic size={18} />
          <span className="text-sm font-medium">Italic</span>
        </button>
      </div>

      {/* Text Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              handleApply('textColor', e.target.value);
            }}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              handleApply('textColor', e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={bgColor === 'transparent' ? '#ffffff' : bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              handleApply('bgColor', e.target.value);
            }}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              handleApply('bgColor', e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="transparent"
          />
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
      >
        Done
      </button>
    </div>
  );
}

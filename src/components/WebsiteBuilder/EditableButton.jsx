import { useState, useRef } from 'react';
import { Palette, Link2, X } from 'lucide-react';

export default function EditableButton({
  text,
  onChange,
  onStyleChange,
  styles = {},
  isEditing,
  onEditStart,
  onEditEnd,
  isInBuilder = false,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [linkUrl, setLinkUrl] = useState(styles.link || '');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [buttonText, setButtonText] = useState(text);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInBuilder && isEditing) {
      const rect = e.currentTarget.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + window.scrollY - 60,
        left: rect.left + window.scrollX,
      });
      setShowToolbar(true);
      onEditStart?.();
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setButtonText(newText);
    onChange(newText);
  };

  const updateStyle = (styleUpdates) => {
    onStyleChange({ ...styles, ...styleUpdates });
  };

  const addLink = () => {
    if (linkUrl) {
      updateStyle({ link: linkUrl });
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const getButtonStyle = () => {
    return {
      backgroundColor: styles.bgColor || '#3b82f6',
      color: styles.textColor || '#ffffff',
      padding: `${styles.paddingY || 12}px ${styles.paddingX || 24}px`,
      fontSize: `${styles.fontSize || 16}px`,
      fontWeight: styles.bold ? 'bold' : 'normal',
      borderRadius: `${styles.borderRadius || 8}px`,
      border: `${styles.borderWidth || 0}px solid ${styles.borderColor || 'transparent'}`,
      cursor: isInBuilder && isEditing ? 'pointer' : 'default',
      outline: isInBuilder && isEditing ? '2px dashed #3b82f6' : 'none',
      transition: 'all 0.2s',
      pointerEvents: isInBuilder ? 'auto' : 'none',
    };
  };

  return (
    <>
      {isInBuilder && isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={buttonText}
            onChange={handleTextChange}
            placeholder="Button text"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            data-no-drag
          />
          <button
            ref={buttonRef}
            onClick={handleClick}
            style={getButtonStyle()}
            className="w-full hover:opacity-80 transition"
            type="button"
          >
            {buttonText || 'Button'}
          </button>
        </div>
      ) : (
        <button
          ref={buttonRef}
          onClick={handleClick}
          style={getButtonStyle()}
          className="hover:opacity-80 transition"
          type="button"
        >
          {text || 'Button'}
        </button>
      )}

      {/* Floating Toolbar */}
      {showToolbar && toolbarPosition && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-xl p-3 z-50 w-80"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700 text-sm">Button Styling</h4>
            <button
              onClick={() => setShowToolbar(false)}
              className="p-1 hover:bg-gray-100 rounded transition"
              type="button"
            >
              <X size={16} />
            </button>
          </div>

          {/* Font Size */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="8"
                max="32"
                value={styles.fontSize || 16}
                onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-10">{styles.fontSize || 16}px</span>
            </div>
          </div>

          {/* Padding */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Padding X</label>
              <input
                type="range"
                min="4"
                max="48"
                value={styles.paddingX || 24}
                onChange={(e) => updateStyle({ paddingX: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{styles.paddingX || 24}px</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Padding Y</label>
              <input
                type="range"
                min="4"
                max="32"
                value={styles.paddingY || 12}
                onChange={(e) => updateStyle({ paddingY: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{styles.paddingY || 12}px</span>
            </div>
          </div>

          {/* Border Radius */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="32"
                value={styles.borderRadius || 8}
                onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-10">{styles.borderRadius || 8}px</span>
            </div>
          </div>

          {/* Text Color */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.textColor || '#ffffff'}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styles.textColor || '#ffffff'}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.bgColor || '#3b82f6'}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styles.bgColor || '#3b82f6'}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          {/* Link Input */}
          {!showLinkInput ? (
            <button
              onClick={() => setShowLinkInput(true)}
              className="w-full p-2 rounded transition flex items-center justify-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium mb-3"
              type="button"
            >
              <Link2 size={16} />
              Add Link
            </button>
          ) : (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  autoFocus
                />
                <button
                  onClick={addLink}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={() => {
              setShowToolbar(false);
              onEditEnd?.();
            }}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-xs font-medium"
            type="button"
          >
            Done
          </button>
        </div>
      )}
    </>
  );
}

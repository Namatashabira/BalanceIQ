import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Type, Palette, Link2, X } from 'lucide-react';

export default function EditableText({
  content,
  onChange,
  onStyleChange,
  styles = {},
  isEditing,
  onEditStart,
  onEditEnd,
  className = '',
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current && !isEditing) {
      textRef.current.innerHTML = content;
    }
  }, [content, isEditing]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText.length > 0 && isEditing) {
      setSelectedText(selectedText);
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + window.scrollY - 60,
        left: rect.left + window.scrollX,
      });
      setShowToolbar(true);
    }
  };

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
  };

  const handleKeyDown = (e) => {
    // Allow Enter for line breaks
    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      onChange(textRef.current.innerHTML);
    }
  };

  const applyStyle = (styleType, value) => {
    if (styleType === 'bold') {
      document.execCommand('bold', false, null);
    } else if (styleType === 'italic') {
      document.execCommand('italic', false, null);
    } else if (styleType === 'fontSize') {
      onStyleChange({ ...styles, fontSize: value });
    } else if (styleType === 'color') {
      onStyleChange({ ...styles, color: value });
    } else if (styleType === 'bgColor') {
      onStyleChange({ ...styles, bgColor: value });
    }
  };

  const addLink = () => {
    if (linkUrl && selectedText) {
      document.execCommand('createLink', false, linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
      setShowToolbar(false);
    }
  };

  const getTextStyle = () => {
    return {
      fontSize: `${styles.fontSize || 24}px`,
      fontWeight: styles.bold ? 'bold' : 'normal',
      fontStyle: styles.italic ? 'italic' : 'normal',
      color: styles.color || '#000000',
      backgroundColor: styles.bgColor || 'transparent',
      padding: styles.bgColor ? '4px 8px' : '0',
      borderRadius: styles.bgColor ? '4px' : '0',
      outline: isEditing ? '2px dashed #3b82f6' : 'none',
      cursor: isEditing ? 'text' : 'default',
      minHeight: '1em',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    };
  };

  return (
    <>
      <div
        ref={textRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onMouseUp={handleMouseUp}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onEditStart}
        onBlur={onEditEnd}
        style={getTextStyle()}
        className={`${className} transition-all`}
      >
        {!isEditing && !content && 'Click to edit...'}
      </div>

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
            <h4 className="font-semibold text-gray-700 text-sm">Text Styling</h4>
            <button
              onClick={() => setShowToolbar(false)}
              className="p-1 hover:bg-gray-100 rounded transition"
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
                max="100"
                value={styles.fontSize || 24}
                onChange={(e) => applyStyle('fontSize', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-10">{styles.fontSize || 24}px</span>
            </div>
          </div>

          {/* Text Styling Buttons */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => applyStyle('bold')}
              className="flex-1 p-2 rounded transition flex items-center justify-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium"
            >
              <Bold size={16} />
              Bold
            </button>
            <button
              onClick={() => applyStyle('italic')}
              className="flex-1 p-2 rounded transition flex items-center justify-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium"
            >
              <Italic size={16} />
              Italic
            </button>
          </div>

          {/* Text Color */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.color || '#000000'}
                onChange={(e) => applyStyle('color', e.target.value)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styles.color || '#000000'}
                onChange={(e) => applyStyle('color', e.target.value)}
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
                value={styles.bgColor || '#ffffff'}
                onChange={(e) => applyStyle('bgColor', e.target.value)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styles.bgColor || 'transparent'}
                onChange={(e) => applyStyle('bgColor', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="transparent"
              />
            </div>
          </div>

          {/* Link Input */}
          {!showLinkInput ? (
            <button
              onClick={() => setShowLinkInput(true)}
              className="w-full p-2 rounded transition flex items-center justify-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
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
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={() => setShowToolbar(false)}
            className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-xs font-medium"
          >
            Done
          </button>
        </div>
      )}
    </>
  );
}

import { Trash2, Copy, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { useState } from 'react';
import EditableText from './EditableText';
import EditableButton from './EditableButton';
import DraggableResizable from './DraggableResizable';

export default function CoverBanner({
  id,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdate,
  data = {
    headline: 'Premium Quality Products',
    headlineStyles: { fontSize: 48, bold: true, italic: false, color: '#ffffff' },
    headlinePosition: { x: 50, y: 50 },
    headlineSize: { width: 'auto', height: 'auto' },
    subheadline: 'Discover our exclusive collection',
    subheadlineStyles: { fontSize: 20, bold: false, italic: false, color: '#f3f4f6' },
    subheadlinePosition: { x: 50, y: 140 },
    subheadlineSize: { width: 'auto', height: 'auto' },
    ctaText: 'Shop Now',
    ctaBtnStyles: { fontSize: 16, textColor: '#1f2937', bgColor: '#ffffff', paddingX: 32, paddingY: 12, borderRadius: 8 },
    ctaBtnPosition: { x: 50, y: 230 },
    ctaBtnSize: { width: 'auto', height: 'auto' },
    backgroundImage: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=600&fit=crop',
    overlayOpacity: 0.4,
    overlayColor: '#000000',
    textAlign: 'left',
    minHeight: 'min-h-96',
  },
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [imagePreview, setImagePreview] = useState(data.backgroundImage);
  const [imageError, setImageError] = useState(false);

  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleStyleChange = (field, styleUpdates) => {
    handleChange(`${field}Styles`, styleUpdates);
  };

  const handlePositionChange = (field, position) => {
    handleChange(`${field}Position`, position);
  };

  const handleSizeChange = (field, size) => {
    handleChange(`${field}Size`, size);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result;
        setImagePreview(imageUrl);
        handleChange('backgroundImage', imageUrl);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[data.textAlign] || 'text-left';

  return (
    <div
      className={`relative border-2 rounded-lg overflow-hidden transition ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      }`}
      onClick={() => onSelect()}
    >
      {/* Edit Controls */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex gap-1 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Background Image with Overlay */}
      <div
        className={`relative ${data.minHeight} bg-cover bg-center`}
        style={{
          backgroundImage: imageError ? 'none' : `url('${imagePreview}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: imageError ? '#e5e7eb' : 'transparent',
        }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: data.overlayColor,
            opacity: data.overlayOpacity,
          }}
        />

        {/* Fallback message when image fails */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm font-medium">Background image not found</p>
              <p className="text-gray-400 text-xs mt-1">Check URL and try again</p>
            </div>
          </div>
        )}

        {/* Content Container - Relative for Absolute Positioning */}
        <div className={`relative z-10 w-full h-full px-6 py-12 ${textAlignClass}`}>
          {/* Headline */}
          <DraggableResizable
            id="headline"
            position={data.headlinePosition}
            size={data.headlineSize}
            onPositionChange={(pos) => handlePositionChange('headline', pos)}
            onSizeChange={(size) => handleSizeChange('headline', size)}
            isEditing={isSelected}
            minWidth={100}
            minHeight={40}
            isDraggable={true}
          >
            <EditableText
              content={data.headline}
              onChange={(value) => handleChange('headline', value)}
              onStyleChange={(styles) => handleStyleChange('headline', styles)}
              styles={data.headlineStyles}
              isEditing={isSelected}
              onEditStart={() => setEditingField('headline')}
              onEditEnd={() => setEditingField(null)}
              className="font-bold"
            />
          </DraggableResizable>

          {/* Subheadline */}
          <DraggableResizable
            id="subheadline"
            position={data.subheadlinePosition}
            size={data.subheadlineSize}
            onPositionChange={(pos) => handlePositionChange('subheadline', pos)}
            onSizeChange={(size) => handleSizeChange('subheadline', size)}
            isEditing={isSelected}
            minWidth={100}
            minHeight={20}
            isDraggable={true}
          >
            <EditableText
              content={data.subheadline}
              onChange={(value) => handleChange('subheadline', value)}
              onStyleChange={(styles) => handleStyleChange('subheadline', styles)}
              styles={data.subheadlineStyles}
              isEditing={isSelected}
              onEditStart={() => setEditingField('subheadline')}
              onEditEnd={() => setEditingField(null)}
            />
          </DraggableResizable>

          {/* CTA Button - NOT draggable */}
          <DraggableResizable
            id="ctaBtn"
            position={data.ctaBtnPosition}
            size={data.ctaBtnSize}
            onPositionChange={(pos) => handlePositionChange('ctaBtn', pos)}
            onSizeChange={(size) => handleSizeChange('ctaBtn', size)}
            isEditing={isSelected}
            minWidth={80}
            minHeight={30}
            isDraggable={false}
          >
            <EditableButton
              text={data.ctaText}
              onChange={(value) => handleChange('ctaText', value)}
              onStyleChange={(styles) => handleStyleChange('ctaBtnStyles', styles)}
              styles={data.ctaBtnStyles}
              isEditing={isSelected}
              onEditStart={() => setEditingField('ctaBtn')}
              onEditEnd={() => setEditingField(null)}
              isInBuilder={true}
            />
          </DraggableResizable>
        </div>
      </div>

      {/* Collapsible Settings Panel */}
      {isSelected && (
        <div className="border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-gray-700">Advanced Settings</span>
            {showSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showSettings && (
            <div className="p-6 space-y-4 border-t border-gray-200 max-h-96 overflow-y-auto">
              {/* Background Image Settings */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm">Background Image</h4>
                <div className="flex gap-2 mb-3">
                  <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition text-center font-medium flex items-center justify-center gap-2 text-sm">
                    <Upload size={16} />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={data.backgroundImage}
                  onChange={(e) => {
                    handleChange('backgroundImage', e.target.value);
                    setImagePreview(e.target.value);
                    setImageError(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Overlay Settings */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-700 text-sm">Overlay</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={data.overlayColor}
                      onChange={(e) => handleChange('overlayColor', e.target.value)}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={data.overlayColor}
                      onChange={(e) => handleChange('overlayColor', e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={data.overlayOpacity}
                      onChange={(e) => handleChange('overlayOpacity', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-10">{Math.round(data.overlayOpacity * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Layout Settings */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-700 text-sm">Layout</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                  <select
                    value={data.textAlign}
                    onChange={(e) => handleChange('textAlign', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Height</label>
                  <select
                    value={data.minHeight}
                    onChange={(e) => handleChange('minHeight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="min-h-64">Small</option>
                    <option value="min-h-96">Medium</option>
                    <option value="min-h-screen">Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

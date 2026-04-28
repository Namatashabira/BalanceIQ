import { Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import EditableText from './EditableText';
import EditableButton from './EditableButton';
import DraggableResizable from './DraggableResizable';

export default function MarketingHero({
  id,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdate,
  data = {
    headline: 'Grow Your Business',
    headlineStyles: { fontSize: 36, bold: true, italic: false, color: '#1f2937' },
    headlinePosition: { x: 20, y: 20 },
    headlineSize: { width: 'auto', height: 'auto' },
    subheadline: 'The all-in-one platform for modern teams',
    subheadlineStyles: { fontSize: 18, bold: false, italic: false, color: '#4b5563' },
    subheadlinePosition: { x: 20, y: 90 },
    subheadlineSize: { width: 'auto', height: 'auto' },
    primaryBtnText: 'Get Started',
    primaryBtnStyles: { fontSize: 16, textColor: '#ffffff', bgColor: '#3b82f6', paddingX: 24, paddingY: 12, borderRadius: 8 },
    primaryBtnPosition: { x: 20, y: 170 },
    primaryBtnSize: { width: 'auto', height: 'auto' },
    secondaryBtnText: 'Learn More',
    secondaryBtnStyles: { fontSize: 16, textColor: '#1f2937', bgColor: '#e5e7eb', paddingX: 24, paddingY: 12, borderRadius: 8 },
    secondaryBtnPosition: { x: 220, y: 170 },
    secondaryBtnSize: { width: 'auto', height: 'auto' },
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop',
    imageAlt: 'Product Image',
    imagePosition: { x: 450, y: 20 },
    imageSize: { width: 300, height: 250 },
    bgColor: '#ffffff',
  },
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [editingField, setEditingField] = useState(null);
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

  return (
    <div
      className={`relative border-2 rounded-lg overflow-visible transition ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      }`}
      onClick={() => onSelect()}
      style={{ backgroundColor: data.bgColor }}
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

      {/* Hero Content - Relative Container for Absolute Positioning */}
      <div className="relative p-12" style={{ minHeight: '450px' }}>
        {/* Headline */}
        <DraggableResizable
          id="headline"
          position={data.headlinePosition}
          size={data.headlineSize}
          onPositionChange={(pos) => handlePositionChange('headline', pos)}
          onSizeChange={(size) => handleSizeChange('headline', size)}
          isEditing={isSelected}
          minWidth={100}
          minHeight={30}
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

        {/* Primary Button - NOT draggable */}
        <DraggableResizable
          id="primaryBtn"
          position={data.primaryBtnPosition}
          size={data.primaryBtnSize}
          onPositionChange={(pos) => handlePositionChange('primaryBtn', pos)}
          onSizeChange={(size) => handleSizeChange('primaryBtn', size)}
          isEditing={isSelected}
          minWidth={80}
          minHeight={30}
          isDraggable={false}
        >
          <EditableButton
            text={data.primaryBtnText}
            onChange={(value) => handleChange('primaryBtnText', value)}
            onStyleChange={(styles) => handleStyleChange('primaryBtnStyles', styles)}
            styles={data.primaryBtnStyles}
            isEditing={isSelected}
            onEditStart={() => setEditingField('primaryBtn')}
            onEditEnd={() => setEditingField(null)}
            isInBuilder={true}
          />
        </DraggableResizable>

        {/* Secondary Button - NOT draggable */}
        <DraggableResizable
          id="secondaryBtn"
          position={data.secondaryBtnPosition}
          size={data.secondaryBtnSize}
          onPositionChange={(pos) => handlePositionChange('secondaryBtn', pos)}
          onSizeChange={(size) => handleSizeChange('secondaryBtn', size)}
          isEditing={isSelected}
          minWidth={80}
          minHeight={30}
          isDraggable={false}
        >
          <EditableButton
            text={data.secondaryBtnText}
            onChange={(value) => handleChange('secondaryBtnText', value)}
            onStyleChange={(styles) => handleStyleChange('secondaryBtnStyles', styles)}
            styles={data.secondaryBtnStyles}
            isEditing={isSelected}
            onEditStart={() => setEditingField('secondaryBtn')}
            onEditEnd={() => setEditingField(null)}
            isInBuilder={true}
          />
        </DraggableResizable>

        {/* Image */}
        <DraggableResizable
          id="image"
          position={data.imagePosition}
          size={data.imageSize}
          onPositionChange={(pos) => handlePositionChange('image', pos)}
          onSizeChange={(size) => handleSizeChange('image', size)}
          isEditing={isSelected}
          minWidth={150}
          minHeight={120}
          isDraggable={true}
        >
          <div className="w-full h-full flex flex-col">
            {isSelected && (
              <input
                type="text"
                value={data.imageUrl}
                onChange={(e) => {
                  handleChange('imageUrl', e.target.value);
                  setImageError(false);
                }}
                placeholder="Image URL"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                data-no-drag
              />
            )}
            {!imageError ? (
              <img
                src={data.imageUrl}
                alt={data.imageAlt}
                className="w-full h-full rounded-lg shadow-lg object-cover border-2 border-dashed border-gray-300"
                onError={(e) => {
                  setImageError(true);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-lg shadow-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm font-medium">Image not found</p>
                  <p className="text-gray-400 text-xs mt-1">Check URL and try again</p>
                </div>
              </div>
            )}
          </div>
        </DraggableResizable>
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
              {/* Background Settings */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm">Background</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={data.bgColor}
                      onChange={(e) => handleChange('bgColor', e.target.value)}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={data.bgColor}
                      onChange={(e) => handleChange('bgColor', e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Image Settings */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-700 text-sm">Image</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={data.imageAlt}
                    onChange={(e) => handleChange('imageAlt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

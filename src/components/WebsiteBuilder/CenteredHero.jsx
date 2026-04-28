import { Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import EditableText from './EditableText';
import EditableButton from './EditableButton';
import DraggableResizable from './DraggableResizable';

export default function CenteredHero({
  id,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdate,
  data = {
    tag: 'New Feature',
    tagStyles: { fontSize: 14, color: '#3b82f6', bgColor: '#dbeafe' },
    tagPosition: { x: 0, y: 0 },
    tagSize: { width: 'auto', height: 'auto' },
    headline: 'Build Faster Than Ever',
    headlineStyles: { fontSize: 48, bold: true, italic: false, color: '#1f2937' },
    headlinePosition: { x: 0, y: 50 },
    headlineSize: { width: 'auto', height: 'auto' },
    description: 'The modern platform for teams that want to ship faster',
    descriptionStyles: { fontSize: 18, bold: false, italic: false, color: '#4b5563' },
    descriptionPosition: { x: 0, y: 140 },
    descriptionSize: { width: 'auto', height: 'auto' },
    ctaText: 'Start Free Trial',
    ctaBtnStyles: { fontSize: 16, textColor: '#ffffff', bgColor: '#3b82f6', paddingX: 32, paddingY: 16, borderRadius: 8 },
    ctaBtnPosition: { x: 0, y: 230 },
    ctaBtnSize: { width: 'auto', height: 'auto' },
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=600&h=400&fit=crop',
    imageAlt: 'Dashboard Screenshot',
    imagePosition: { x: 0, y: 320 },
    imageSize: { width: 600, height: 400 },
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
      <div className="relative py-20 px-6" style={{ minHeight: '800px' }}>
        {/* Tag */}
        <DraggableResizable
          id="tag"
          position={data.tagPosition}
          size={data.tagSize}
          onPositionChange={(pos) => handlePositionChange('tag', pos)}
          onSizeChange={(size) => handleSizeChange('tag', size)}
          isEditing={isSelected}
          minWidth={80}
          minHeight={20}
          isDraggable={true}
        >
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold">
            <EditableText
              content={data.tag}
              onChange={(value) => handleChange('tag', value)}
              onStyleChange={(styles) => handleStyleChange('tag', styles)}
              styles={data.tagStyles}
              isEditing={isSelected}
              onEditStart={() => setEditingField('tag')}
              onEditEnd={() => setEditingField(null)}
            />
          </div>
        </DraggableResizable>

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

        {/* Description */}
        <DraggableResizable
          id="description"
          position={data.descriptionPosition}
          size={data.descriptionSize}
          onPositionChange={(pos) => handlePositionChange('description', pos)}
          onSizeChange={(size) => handleSizeChange('description', size)}
          isEditing={isSelected}
          minWidth={100}
          minHeight={30}
          isDraggable={true}
        >
          <EditableText
            content={data.description}
            onChange={(value) => handleChange('description', value)}
            onStyleChange={(styles) => handleStyleChange('description', styles)}
            styles={data.descriptionStyles}
            isEditing={isSelected}
            onEditStart={() => setEditingField('description')}
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

        {/* Image */}
        <DraggableResizable
          id="image"
          position={data.imagePosition}
          size={data.imageSize}
          onPositionChange={(pos) => handlePositionChange('image', pos)}
          onSizeChange={(size) => handleSizeChange('image', size)}
          isEditing={isSelected}
          minWidth={200}
          minHeight={150}
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
                className="w-full h-full rounded-lg shadow-2xl object-cover border-2 border-dashed border-gray-300"
                onError={(e) => {
                  setImageError(true);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-lg shadow-2xl border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
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

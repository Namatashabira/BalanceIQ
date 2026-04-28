import { useState } from 'react';
import { Type, Image, Square, ShoppingCart, Grid, Layout, ChevronLeft, Zap } from 'lucide-react';

const components = [
  { id: 'text', name: 'Text', icon: Type, type: 'text' },
  { id: 'image', name: 'Image', icon: Image, type: 'image' },
  { id: 'button', name: 'Button', icon: Square, type: 'button' },
  { id: 'product', name: 'Product', icon: ShoppingCart, type: 'product' },
  { id: 'grid', name: 'Grid', icon: Grid, type: 'grid' },
  { id: 'section', name: 'Section', icon: Layout, type: 'section' },
];

const blocks = [
  {
    id: 'marketing-hero',
    name: 'Marketing Hero',
    icon: Zap,
    type: 'hero-banner',
    heroType: 'marketing',
  },
  {
    id: 'centered-hero',
    name: 'Centered SaaS Hero',
    icon: Zap,
    type: 'hero-banner',
    heroType: 'centered',
  },
  {
    id: 'cover-banner',
    name: 'Cover Banner',
    icon: Zap,
    type: 'hero-banner',
    heroType: 'cover',
  },
  {
    id: 'hero',
    name: 'Hero Section',
    icon: Layout,
    type: 'block',
    elements: [
      { type: 'section', content: 'Hero Section', bgColor: '#1f2937' },
      { type: 'text', content: 'Welcome to Your Store', textColor: '#ffffff' },
      { type: 'button', content: 'Shop Now' },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: Grid,
    type: 'block',
    elements: [
      { type: 'section', content: 'Features Section' },
      { type: 'grid', content: '3 columns' },
    ],
  },
  {
    id: 'products',
    name: 'Products Grid',
    icon: ShoppingCart,
    type: 'block',
    elements: [
      { type: 'section', content: 'Products' },
      { type: 'grid', content: '4 columns' },
      { type: 'product', content: 'Product 1' },
      { type: 'product', content: 'Product 2' },
      { type: 'product', content: 'Product 3' },
      { type: 'product', content: 'Product 4' },
    ],
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    icon: Layout,
    type: 'block',
    elements: [
      { type: 'section', content: 'What Our Customers Say' },
      { type: 'text', content: 'Great products and service!' },
    ],
  },
  {
    id: 'cta',
    name: 'Call to Action',
    icon: Square,
    type: 'block',
    elements: [
      { type: 'section', content: 'CTA Section', bgColor: '#3b82f6' },
      { type: 'text', content: 'Ready to get started?', textColor: '#ffffff' },
      { type: 'button', content: 'Get Started' },
    ],
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: Layout,
    type: 'block',
    elements: [
      { type: 'section', content: 'Footer', bgColor: '#1f2937' },
      { type: 'text', content: '© 2024 Your Store. All rights reserved.', textColor: '#ffffff' },
    ],
  },
];

export default function LeftSidebar({ onDragStart, isOpen, onToggle }) {
  const [activeTab, setActiveTab] = useState('components');

  return (
    <div
      className={`bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Elements</h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded transition"
          title="Close sidebar"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'components'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'blocks'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Blocks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'components' && (
          <div className="space-y-2">
            {components.map((component) => {
              const Icon = component.icon;
              return (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, component)}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-move transition border border-gray-200 hover:border-blue-300"
                >
                  <Icon size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{component.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="space-y-2">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, block)}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg cursor-move transition border border-purple-200 hover:border-purple-400"
                >
                  <Icon size={20} className="text-purple-600" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{block.name}</span>
                    {block.type === 'block' && (
                      <p className="text-xs text-gray-500">{block.elements?.length || 0} elements</p>
                    )}
                    {block.type === 'hero-banner' && (
                      <p className="text-xs text-gray-500">Hero Banner</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

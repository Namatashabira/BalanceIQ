import { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import CanvasEditor from './CanvasEditor';
import RightSidebar from './RightSidebar';
import { MarketingHero, CenteredHero, CoverBanner } from './HeroBanners.js';

export default function BuilderWorkspace() {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const handleDragStart = (e, component) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
  };

  const handleDrop = (e) => {
    const componentData = e.dataTransfer.getData('component');
    if (componentData) {
      const component = JSON.parse(componentData);

      // Handle hero banner drops
      if (component.type === 'hero-banner') {
        const heroBannerData = {
          marketing: {
            headline: 'Grow Your Business',
            subheadline: 'The all-in-one platform for modern teams',
            primaryBtnText: 'Get Started',
            primaryBtnUrl: '#',
            secondaryBtnText: 'Learn More',
            secondaryBtnUrl: '#',
            imageUrl: 'https://via.placeholder.com/500x400?text=Product+Image',
            imageAlt: 'Product Image',
            bgColor: '#ffffff',
            textColor: '#000000',
            headlineSize: 'text-4xl',
            subheadlineSize: 'text-lg',
          },
          centered: {
            tag: 'New Feature',
            headline: 'Build Faster Than Ever',
            description: 'The modern platform for teams that want to ship faster',
            ctaText: 'Start Free Trial',
            ctaUrl: '#',
            imageUrl: 'https://via.placeholder.com/600x400?text=Dashboard',
            imageAlt: 'Dashboard Screenshot',
            bgColor: '#ffffff',
            textColor: '#000000',
            tagColor: '#3b82f6',
            headlineSize: 'text-5xl',
          },
          cover: {
            headline: 'Premium Quality Products',
            subheadline: 'Discover our exclusive collection',
            ctaText: 'Shop Now',
            ctaUrl: '#',
            backgroundImage: 'https://via.placeholder.com/1200x600?text=Cover+Banner',
            overlayOpacity: 0.5,
            overlayColor: '#000000',
            textColor: '#ffffff',
            textAlign: 'center',
            headlineSize: 'text-5xl',
            minHeight: 'min-h-96',
          },
        };

        const newElement = {
          id: Date.now(),
          type: 'hero-banner',
          heroType: component.heroType,
          data: heroBannerData[component.heroType] || heroBannerData.marketing,
        };
        setElements([...elements, newElement]);
      }
      // Handle block drops
      else if (component.type === 'block' && component.elements) {
        const newElements = component.elements.map((el) => ({
          id: Date.now() + Math.random(),
          ...el,
          bgColor: el.bgColor || '#ffffff',
          textColor: el.textColor || '#000000',
          padding: el.padding || 16,
        }));
        setElements([...elements, ...newElements]);
      }
      // Handle single component drops
      else {
        const newElement = {
          id: Date.now(),
          type: component.type,
          content: component.type === 'text' ? 'Edit this text' : component.type === 'button' ? 'Click me' : '',
          bgColor: '#ffffff',
          textColor: '#000000',
          padding: 16,
          margin: 0,
          width: 'full',
          textAlign: 'left',
        };
        setElements([...elements, newElement]);
      }
    }
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
  };

  const handleUpdateElement = (updatedElement) => {
    setElements(elements.map(el => el.id === updatedElement.id ? updatedElement : el));
    setSelectedElement(updatedElement);
  };

  const handleDeleteElement = (elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleDuplicateElement = (elementId) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (elementToDuplicate) {
      const duplicated = {
        ...elementToDuplicate,
        id: Date.now(),
      };
      setElements([...elements, duplicated]);
    }
  };

  const renderElement = (element) => {
    if (element.type === 'hero-banner') {
      const isSelected = selectedElement?.id === element.id;
      const commonProps = {
        id: element.id,
        isSelected,
        onSelect: () => handleSelectElement(element),
        onDelete: () => handleDeleteElement(element.id),
        onDuplicate: () => handleDuplicateElement(element.id),
        onUpdate: (updatedData) => handleUpdateElement({ ...element, data: updatedData }),
        data: element.data,
      };

      switch (element.heroType) {
        case 'marketing':
          return <MarketingHero key={element.id} {...commonProps} />;
        case 'centered':
          return <CenteredHero key={element.id} {...commonProps} />;
        case 'cover':
          return <CoverBanner key={element.id} {...commonProps} />;
        default:
          return null;
      }
    }

    // Return null for non-hero elements (handled by CanvasEditor)
    return null;
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      <LeftSidebar
        onDragStart={handleDragStart}
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
      />

      <CanvasEditor
        elements={elements}
        onDrop={handleDrop}
        onSelectElement={handleSelectElement}
        selectedElement={selectedElement}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        renderHeroBanner={renderElement}
      />

      <RightSidebar
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        isOpen={rightSidebarOpen}
        onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
      />
    </div>
  );
}

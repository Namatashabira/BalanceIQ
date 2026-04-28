import { useState, useCallback } from 'react';
import { Settings, Plug } from 'lucide-react';
import Header from '../../components/WebsiteBuilder/Header';
import TemplateGallery from '../../components/WebsiteBuilder/TemplateGallery';
import BuilderWorkspace from '../../components/WebsiteBuilder/BuilderWorkspace';
import EcommerceSettings from '../../components/WebsiteBuilder/EcommerceSettings';
import IntegrationPanel from '../../components/WebsiteBuilder/IntegrationPanel';

export default function WebsiteBuilder() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEcommerce, setShowEcommerce] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleSave = useCallback(() => {
    console.log('Saving website...');
    alert('Website saved successfully!');
  }, []);

  const handlePreview = useCallback(() => {
    console.log('Opening preview...');
    window.open('/preview', '_blank');
  }, []);

  const handlePublish = useCallback(() => {
    console.log('Publishing website...');
    alert('Website published successfully!');
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the entire website? This cannot be undone.')) {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const handleSelectTemplate = useCallback((template) => {
    console.log('Selected template:', template);
    setShowTemplates(false);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-50">
      <Header
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => setShowTemplates(true)}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium text-sm"
        >
          Choose Template
        </button>
        <button
          onClick={() => setShowEcommerce(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium text-sm"
        >
          <Settings size={18} />
          E-commerce
        </button>
        <button
          onClick={() => setShowIntegrations(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-medium text-sm"
        >
          <Plug size={18} />
          Integrations
        </button>
        <div className="flex-1" />
        <div className="text-sm text-gray-500">
          <span className="font-medium">Tip:</span> Drag components or blocks from the left sidebar to build your website
        </div>
      </div>

      <BuilderWorkspace />

      <TemplateGallery
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleSelectTemplate}
      />

      <EcommerceSettings
        isOpen={showEcommerce}
        onClose={() => setShowEcommerce(false)}
      />

      <IntegrationPanel
        isOpen={showIntegrations}
        onClose={() => setShowIntegrations(false)}
      />
    </div>
  );
}

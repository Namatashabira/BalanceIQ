import { Save, Eye, Upload, RotateCcw, Undo2, Redo2 } from 'lucide-react';

export default function Header({ onSave, onPreview, onPublish, onReset, onUndo, onRedo, canUndo, canRedo }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Website Builder</h1>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Undo"
          >
            <Undo2 size={18} className="text-gray-600" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Redo"
          >
            <Redo2 size={18} className="text-gray-600" />
          </button>
          <button
            onClick={onReset}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Reset"
          >
            <RotateCcw size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
        >
          <Save size={18} />
          Save
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium"
        >
          <Eye size={18} />
          Preview
        </button>
        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
        >
          <Upload size={18} />
          Publish
        </button>
      </div>
    </header>
  );
}

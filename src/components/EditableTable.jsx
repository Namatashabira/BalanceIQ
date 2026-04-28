import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, Settings, Copy, Paste, Calculator } from 'lucide-react';
import FormulaBuilder from './FormulaBuilder';

export default function EditableTable({ data, columns, onUpdateCell, onDeleteRow, onUpdateColumns }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnSettings, setColumnSettings] = useState({});
  const [selectedCells, setSelectedCells] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [formulaColumnKey, setFormulaColumnKey] = useState('');
  const tableRef = useRef(null);
  const inputRef = useRef(null);

  const startEdit = (rowId, columnKey, currentValue) => {
    setEditingCell(`${rowId}-${columnKey}`);
    setEditValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editingCell) {
      const [rowId, columnKey] = editingCell.split('-');
      let value = editValue;
      
      // Type conversion
      const column = columns.find(col => col.key === columnKey);
      if (column?.type === 'number') {
        value = parseFloat(value) || 0;
      }
      
      onUpdateCell(parseInt(rowId), columnKey, value);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
      navigateCell('down');
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
      navigateCell(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'ArrowUp' && !editingCell) {
      e.preventDefault();
      navigateCell('up');
    } else if (e.key === 'ArrowDown' && !editingCell) {
      e.preventDefault();
      navigateCell('down');
    } else if (e.key === 'ArrowLeft' && !editingCell) {
      e.preventDefault();
      navigateCell('left');
    } else if (e.key === 'ArrowRight' && !editingCell) {
      e.preventDefault();
      navigateCell('right');
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      copySelectedCells();
    } else if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      pasteClipboard();
    }
  };

  const navigateCell = (direction) => {
    if (!selectedCells.length) return;
    
    const [currentRowId, currentColumnKey] = selectedCells[0].split('-');
    const currentRowIndex = data.findIndex(row => row.id === parseInt(currentRowId));
    const currentColIndex = columns.findIndex(col => col.key === currentColumnKey);
    
    let newRowIndex = currentRowIndex;
    let newColIndex = currentColIndex;
    
    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(data.length - 1, currentRowIndex + 1);
        break;
      case 'left':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
        newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
        break;
    }
    
    if (newRowIndex !== currentRowIndex || newColIndex !== currentColIndex) {
      const newRowId = data[newRowIndex]?.id;
      const newColumnKey = columns[newColIndex]?.key;
      if (newRowId && newColumnKey) {
        setSelectedCells([`${newRowId}-${newColumnKey}`]);
        if (columns[newColIndex]?.editable) {
          startEdit(newRowId, newColumnKey, data[newRowIndex][newColumnKey]);
        }
      }
    }
  };

  const copySelectedCells = () => {
    if (selectedCells.length === 0) return;
    
    const cellData = selectedCells.map(cellKey => {
      const [rowId, columnKey] = cellKey.split('-');
      const row = data.find(r => r.id === parseInt(rowId));
      return row ? row[columnKey] : '';
    });
    
    setClipboard(cellData);
  };

  const pasteClipboard = () => {
    if (!clipboard || selectedCells.length === 0) return;
    
    selectedCells.forEach((cellKey, index) => {
      if (index < clipboard.length) {
        const [rowId, columnKey] = cellKey.split('-');
        const column = columns.find(col => col.key === columnKey);
        if (column?.editable) {
          onUpdateCell(parseInt(rowId), columnKey, clipboard[index]);
        }
      }
    });
  };

  const handleCellMouseDown = (rowId, columnKey, e) => {
    e.preventDefault();
    const cellKey = `${rowId}-${columnKey}`;
    setDragStart(cellKey);
    setSelectedCells([cellKey]);
  };

  const handleCellMouseEnter = (rowId, columnKey) => {
    if (dragStart) {
      const cellKey = `${rowId}-${columnKey}`;
      setDragEnd(cellKey);
      
      // Calculate selection range
      const [startRowId, startColKey] = dragStart.split('-');
      const startRowIndex = data.findIndex(row => row.id === parseInt(startRowId));
      const startColIndex = columns.findIndex(col => col.key === startColKey);
      const endRowIndex = data.findIndex(row => row.id === parseInt(rowId));
      const endColIndex = columns.findIndex(col => col.key === columnKey);
      
      const minRow = Math.min(startRowIndex, endRowIndex);
      const maxRow = Math.max(startRowIndex, endRowIndex);
      const minCol = Math.min(startColIndex, endColIndex);
      const maxCol = Math.max(startColIndex, endColIndex);
      
      const selection = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (data[r] && columns[c]) {
            selection.push(`${data[r].id}-${columns[c].key}`);
          }
        }
      }
      setSelectedCells(selection);
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const updateColumn = (columnKey, updates) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, ...updates } : col
    );
    onUpdateColumns(updatedColumns);
    setEditingColumn(null);
  };

  const deleteColumn = (columnKey) => {
    if (confirm('Are you sure you want to delete this column?')) {
      const updatedColumns = columns.filter(col => col.key !== columnKey);
      onUpdateColumns(updatedColumns);
    }
  };

  const renderCell = (row, column) => {
    const cellKey = `${row.id}-${column.key}`;
    const isEditing = editingCell === cellKey;
    const isSelected = selectedCells.includes(cellKey);
    const value = row[column.key];

    if (isEditing && column.editable) {
      if (column.type === 'dropdown') {
        return (
          <select
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {column.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={inputRef}
          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyPress}
          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
          step={column.type === 'number' ? 'any' : undefined}
        />
      );
    }

    let displayValue = value;
    if (column.type === 'number' && value !== null && value !== undefined && value !== '') {
      displayValue = new Intl.NumberFormat().format(value);
    } else if (column.type === 'date' && value) {
      displayValue = new Date(value).toLocaleDateString();
    }

    const cellClass = `px-2 py-1 min-h-[32px] flex items-center transition-colors border-r border-b ${
      column.editable ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50'
    } ${column.type === 'formula' ? 'font-mono text-sm bg-yellow-50' : ''} ${
      column.type === 'number' ? 'text-right' : ''
    } ${isSelected ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`;

    return (
      <div
        className={cellClass}
        onClick={() => column.editable && startEdit(row.id, column.key, value)}
        onMouseDown={(e) => handleCellMouseDown(row.id, column.key, e)}
        onMouseEnter={() => handleCellMouseEnter(row.id, column.key)}
        title={column.editable ? 'Click to edit, Ctrl+C to copy, Ctrl+V to paste' : ''}
      >
        {displayValue || (column.editable ? <span className="text-gray-400 italic">Click to edit</span> : '')}
      </div>
    );
  };

  const renderColumnHeader = (column) => {
    const isEditing = editingColumn === column.key;
    
    if (isEditing) {
      return (
        <div className="flex flex-col gap-2 p-2">
          <input
            type="text"
            value={columnSettings.label || column.label}
            onChange={(e) => setColumnSettings({...columnSettings, label: e.target.value})}
            className="px-2 py-1 border rounded text-sm"
            placeholder="Column name"
          />
          <select
            value={columnSettings.type || column.type}
            onChange={(e) => setColumnSettings({...columnSettings, type: e.target.value})}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="dropdown">Dropdown</option>
            <option value="formula">Formula</option>
          </select>
          {(columnSettings.type === 'dropdown' || column.type === 'dropdown') && (
            <input
              type="text"
              value={columnSettings.options?.join(',') || column.options?.join(',') || ''}
              onChange={(e) => setColumnSettings({...columnSettings, options: e.target.value.split(',').map(s => s.trim())})}
              className="px-2 py-1 border rounded text-sm"
              placeholder="Options (comma separated)"
            />
          )}
          {(columnSettings.type === 'formula' || column.type === 'formula') && (
            <div className="flex gap-1">
              <input
                type="text"
                value={columnSettings.formula || column.formula || ''}
                onChange={(e) => setColumnSettings({...columnSettings, formula: e.target.value})}
                className="flex-1 px-2 py-1 border rounded text-sm"
                placeholder="Formula (e.g., quantity * price)"
              />
              <button
                onClick={() => {
                  setFormulaColumnKey(column.key);
                  setShowFormulaBuilder(true);
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                title="Open Formula Builder"
              >
                <Calculator size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => updateColumn(column.key, columnSettings)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setEditingColumn(null)}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
            >
              Cancel
            </button>
            {column.key.startsWith('col_') && (
              <button
                onClick={() => deleteColumn(column.key)}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <div className="flex flex-col">
          <span className="font-medium">{column.label}</span>
          {column.type === 'formula' && (
            <span className="text-xs text-gray-500 font-mono">
              ={column.formula}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setEditingColumn(column.key);
            setColumnSettings({
              label: column.label,
              type: column.type,
              options: column.options,
              formula: column.formula
            });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          title="Edit column"
        >
          <Settings size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2 text-sm">
        <button
          onClick={copySelectedCells}
          disabled={selectedCells.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title="Copy selected cells (Ctrl+C)"
        >
          <Copy size={14} />
          Copy
        </button>
        <button
          onClick={pasteClipboard}
          disabled={!clipboard || selectedCells.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          title="Paste clipboard (Ctrl+V)"
        >
          <Paste size={14} />
          Paste
        </button>
        {selectedCells.length > 0 && (
          <span className="text-gray-600">
            {selectedCells.length} cell{selectedCells.length > 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      <div className="overflow-x-auto" ref={tableRef} tabIndex={0} onKeyDown={handleKeyPress}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th key={column.key} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-r min-w-[120px]">
                  {renderColumnHeader(column)}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(column => (
                  <td key={column.key} className="p-0">
                    {renderCell(row, column)}
                  </td>
                ))}
                <td className="px-4 py-2 border-b border-gray-200">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete row"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data available. Click "Add Row" to get started.
        </div>
      )}

      {/* Formula Builder Modal */}
      <FormulaBuilder
        isOpen={showFormulaBuilder}
        onClose={() => setShowFormulaBuilder(false)}
        onSave={(formula) => {
          setColumnSettings({...columnSettings, formula});
        }}
        initialFormula={columnSettings.formula || ''}
        columns={columns}
        columnKey={formulaColumnKey}
      />
    </div>
  );
}
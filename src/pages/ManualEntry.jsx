import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Save, Download, Filter, SortAsc, Trash2, Upload, RefreshCw, Calculator, Bold, Italic, Underline, Palette, Image, MoreHorizontal, AlignLeft, AlignCenter, AlignRight, Type, Package } from 'lucide-react';
import SimpleChart from '../components/SimpleChart';
import { fetchProducts } from '../services/productAPI';

const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('/')) {
    return `http://127.0.0.1:8000${url}`;
  }
  return url;
};

const getPrimaryProductImage = (product) => {
  if (!product) return '';
  const imagesArray = Array.isArray(product.images) ? product.images : [];
  const productImagesArray = Array.isArray(product.product_images || product.productImages)
    ? (product.product_images || product.productImages)
    : [];
  const fromProductImages = productImagesArray.length > 0
    ? (productImagesArray[0]?.image_url || productImagesArray[0]?.image)
    : null;
  const candidate = product.image || imagesArray[0] || fromProductImages;
  return resolveImageUrl(candidate);
};

// Helper to fetch products by image search
async function fetchProductsByImageSearch(searchValue, setTableData, setProductsError) {
  try {
    // You may want to adjust the backend to support searching by image name or metadata
    const data = await fetchProducts({ search: searchValue });
    if (Array.isArray(data)) {
      setTableData(data.map(product => ({
        id: product.id,
        product: product.name,
        quantity: product.quantity || 0,
        price: product.price || 0,
        status: product.status || 'Pending',
        date: product.date || '',
        image: getPrimaryProductImage(product) || '',
        total: (product.quantity || 0) * (product.price || 0)
      })));
    }
    setProductsError('');
  } catch (error) {
    setProductsError('Unable to fetch images for search.');
  }
}

export default function ManualEntry() {
  const [tableData, setTableData] = useState([
    {
      id: 1,
      product: 'Coffee Beans',
      quantity: 10,
      price: 25000,
      status: 'Pending',
      date: '2024-01-15',
      total: 250000
    },
    {
      id: 2,
      product: 'Tea Leaves',
      quantity: 5,
      price: 15000,
      status: 'Confirmed',
      date: '2024-01-16',
      total: 75000
    }
  ]); // <-- Closed tableData array properly

  const [columns, setColumns] = useState([
    { key: 'id', label: 'ID', type: 'number', editable: false },
    { key: 'product', label: 'Product', type: 'text', editable: true },
    { key: 'quantity', label: 'Quantity', type: 'number', editable: true },
    { key: 'price', label: 'Price (UGX)', type: 'number', editable: true },
    { key: 'status', label: 'Status', type: 'dropdown', options: ['Pending', 'Confirmed', 'Completed'], editable: true },
    { key: 'date', label: 'Date', type: 'date', editable: true },
    { key: 'image', label: 'Image', type: 'image', editable: true },
    { key: 'total', label: 'Total', type: 'formula', formula: 'quantity * price', editable: false }
  ]);

  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectionRange, setSelectionRange] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('11');
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [cellFormats, setCellFormats] = useState({});
  const [rowFormats, setRowFormats] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [contextMenu, setContextMenu] = useState(null);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [mergedCells, setMergedCells] = useState({});
  const [frozenColumns, setFrozenColumns] = useState(0);
  const [columnWidths, setColumnWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const tableRef = useRef(null);

  // Online/offline sync management
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingChanges, setPendingChanges] = useState(0);
  const [localData, setLocalData] = useState(null);
  const conflicts = [];
  const resolveConflict = () => {};
  
  // Auto-save and sync functions
  const saveToLocal = () => {
    const data = { tableData, columns, cellFormats, rowFormats };
    localStorage.setItem('manualEntryData', JSON.stringify(data));
    setLastSaved(new Date());
  };
  
  const loadFromLocal = () => {
    const saved = localStorage.getItem('manualEntryData');
    if (saved) {
      const data = JSON.parse(saved);
      setTableData(data.tableData || tableData);
      setColumns(data.columns || columns);
      setCellFormats(data.cellFormats || {});
      setRowFormats(data.rowFormats || {});
    }
  };
  
  const syncToServer = async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus('success');
      setPendingChanges(0);
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed:', error);
    }
  };
  
  const forceSync = () => {
    if (isOnline && pendingChanges > 0) {
      syncToServer();
    }
  };

  // Load products so manual entry can reference uploaded catalog items
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      // Try to get tenant_uuid from localStorage
      const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
      const tenant_uuid = activeTenant?.uuid || activeTenant?.id;
      // Fetch products for the tenant
      const data = await fetchProducts({ tenant_uuid });
      setProducts(Array.isArray(data) ? data : []);
      setProductsError('');
    } catch (error) {
      console.error('Failed to load products for manual entry', error);
      setProducts([]);
      setProductsError('Unable to load products. Check backend.');
      } finally {
        setProductsLoading(false);
      }
    }, [fetchProducts]);
    

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    if (!filterColumn || !filterValue) return tableData.slice().sort((a, b) => {
      if (!sortColumn) return 0;
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? direction : aVal < bVal ? -direction : 0;
    });
    if (filterColumn === 'image') {
      // When searching for images, tableData is replaced by server results
      return tableData.slice().sort((a, b) => {
        if (!sortColumn) return 0;
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? direction : aVal < bVal ? -direction : 0;
      });
    }
    return tableData.filter(row => {
      const value = row[filterColumn]?.toString().toLowerCase();
      return value?.includes(filterValue.toLowerCase());
    }).sort((a, b) => {
      if (!sortColumn) return 0;
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal > bVal ? direction : aVal < bVal ? -direction : 0;
    });
  }, [tableData, filterColumn, filterValue, sortColumn, sortDirection]);

  // Add new row
  const addRow = (insertIndex = -1) => {
    saveToHistory();
    
    const newId = Math.max(...tableData.map(row => row.id), 0) + 1;
    const newRow = {
      id: newId,
      product: '',
      quantity: 0,
      price: 0,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      total: 0
    };
    
    if (insertIndex === -1) {
      setTableData([...tableData, newRow]);
    } else {
      const newData = [...tableData];
      newData.splice(insertIndex + 1, 0, newRow);
      setTableData(newData);
    }
    
    scheduleAutoSave();
  };

  // Delete row
  const deleteRow = (id) => {
    saveToHistory();
    setTableData(tableData.filter(row => row.id !== id));
    scheduleAutoSave();
  };

  // Update cell value
  const updateCell = (rowId, columnKey, value) => {
    // Save to history before making changes
    saveToHistory();
    
    setTableData(prevData => 
      prevData.map(row => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [columnKey]: value };
          
          // Schedule auto-save
          scheduleAutoSave();
          
                  // Calculate formulas with enhanced support
          columns.forEach(col => {
            if (col.type === 'formula' && col.formula) {
              try {
                let formula = col.formula;
                
                // Replace column references with values
                columns.forEach(refCol => {
                  const regex = new RegExp(`\\b${refCol.key}\\b`, 'g');
                  formula = formula.replace(regex, updatedRow[refCol.key] || 0);
                });
                
                // Advanced functions
                formula = formula.replace(/SUM\(([^)]+)\)/g, (match, range) => {
                  const keys = range.split(',').map(k => k.trim());
                  return keys.reduce((sum, key) => sum + (updatedRow[key] || 0), 0);
                });
                
                formula = formula.replace(/AVERAGE\(([^)]+)\)/g, (match, range) => {
                  const keys = range.split(',').map(k => k.trim());
                  const sum = keys.reduce((sum, key) => sum + (updatedRow[key] || 0), 0);
                  return keys.length > 0 ? sum / keys.length : 0;
                });
                
                formula = formula.replace(/MIN\(([^)]+)\)/g, (match, range) => {
                  const keys = range.split(',').map(k => k.trim());
                  return Math.min(...keys.map(key => updatedRow[key] || 0));
                });
                
                formula = formula.replace(/MAX\(([^)]+)\)/g, (match, range) => {
                  const keys = range.split(',').map(k => k.trim());
                  return Math.max(...keys.map(key => updatedRow[key] || 0));
                });
                
                // IF function: IF(condition, trueValue, falseValue)
                formula = formula.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/g, (match, condition, trueVal, falseVal) => {
                  try {
                    const conditionResult = Function('"use strict"; return (' + condition + ')')();
                    return conditionResult ? trueVal.trim() : falseVal.trim();
                  } catch (e) {
                    return falseVal.trim();
                  }
                });
                
                // COUNTIF function
                formula = formula.replace(/COUNTIF\(([^,]+),([^)]+)\)/g, (match, range, criteria) => {
                  try {
                    const keys = range.split(',').map(k => k.trim());
                    return keys.filter(key => {
                      const value = updatedRow[key] || 0;
                      try {
                        return Function('"use strict"; return (' + value + criteria + ')')();
                      } catch (e) {
                        return false;
                      }
                    }).length;
                  } catch (e) {
                    return 0;
                  }
                });
                
                // SUMIF function
                formula = formula.replace(/SUMIF\(([^,]+),([^,]+),([^)]+)\)/g, (match, range, criteria, sumRange) => {
                  const keys = range.split(',').map(k => k.trim());
                  const sumKeys = sumRange.split(',').map(k => k.trim());
                  let sum = 0;
                  keys.forEach((key, index) => {
                    const value = updatedRow[key] || 0;
                    if (Function('"use strict"; return (' + value + criteria + ')')()) {
                      sum += updatedRow[sumKeys[index]] || 0;
                    }
                  });
                  return sum;
                });
                
                // Evaluate the formula safely
                try {
                  updatedRow[col.key] = Function('"use strict"; return (' + formula + ')')();
                } catch (evalError) {
                  console.warn(`Formula evaluation error in column ${col.key}:`, evalError);
                  updatedRow[col.key] = 0;
                }
              } catch (e) {
                console.warn(`Formula error in column ${col.key}:`, e);
                updatedRow[col.key] = 0;
              }
            }
          });
          
          return updatedRow;
        }
        return row;
      })
    );
  };

  // Add new column
  const addColumn = (insertIndex = -1) => {
    saveToHistory();
    
    const newColumn = {
      key: `col_${Date.now()}`,
      label: 'New Column',
      type: 'text',
      editable: true
    };
    
    if (insertIndex === -1) {
      setColumns([...columns, newColumn]);
    } else {
      const newColumns = [...columns];
      newColumns.splice(insertIndex + 1, 0, newColumn);
      setColumns(newColumns);
    }
    
    setTableData(tableData.map(row => ({ ...row, [newColumn.key]: '' })));
    scheduleAutoSave();
  };

  // Delete column
  const deleteColumn = (columnKey) => {
    saveToHistory();
    setColumns(columns.filter(col => col.key !== columnKey));
    setTableData(tableData.map(row => {
      const { [columnKey]: deleted, ...rest } = row;
      return rest;
    }));
    scheduleAutoSave();
  };

  // Update column header
  const updateColumnHeader = (columnKey, newLabel) => {
    saveToHistory();
    setColumns(columns.map(col => 
      col.key === columnKey ? { ...col, label: newLabel } : col
    ));
    scheduleAutoSave();
  };

  // Cell formatting functions
  const formatCell = (rowId, columnKey, format) => {
    const cellKey = `${rowId}-${columnKey}`;
    setCellFormats(prev => ({
      ...prev,
      [cellKey]: { ...prev[cellKey], ...format }
    }));
  };

  // Row formatting functions
  const formatRow = (rowId, format) => {
    setRowFormats(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], ...format }
    }));
  };

  // Get combined cell and row formatting
  const getCellStyle = (rowId, columnKey) => {
    const cellKey = `${rowId}-${columnKey}`;
    const cellFormat = cellFormats[cellKey] || {};
    const rowFormat = rowFormats[rowId] || {};
    return { ...rowFormat, ...cellFormat };
  };

  // Convert column index to Excel letter (A, B, C...)
  const getColumnLetter = (index) => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // Get current cell formatting for button states
  const getCurrentCellFormat = () => {
    if (!selectedCell) return {};
    const cellKey = `${selectedCell.rowId}-${selectedCell.columnKey}`;
    return cellFormats[cellKey] || {};
  };

  // Toggle formatting (remove if exists, add if doesn't)
  const toggleFormatting = (property, value) => {
    const currentFormat = getCurrentCellFormat();
    const newFormat = { ...currentFormat };
    
    if (currentFormat[property] === value) {
      // Remove the formatting
      delete newFormat[property];
    } else {
      // Add the formatting
      newFormat[property] = value;
    }
    
    applyFormatting({ [property]: newFormat[property] });
  };

  // Apply formatting to selected cell or range
  const applyFormatting = (format) => {
    saveToHistory();
    
    if (selectionRange) {
      // Apply to entire selection range
      for (let r = selectionRange.startRow; r <= selectionRange.endRow; r++) {
        const row = filteredData[r];
        for (let c = selectionRange.startCol; c <= selectionRange.endCol; c++) {
          const col = columns[c];
          formatCell(row.id, col.key, format);
        }
      }
    } else if (selectedCell) {
      // Apply to single cell
      formatCell(selectedCell.rowId, selectedCell.columnKey, format);
    }
    
    // Trigger auto-save
    scheduleAutoSave();
  };
  
  // Schedule auto-save
  const scheduleAutoSave = () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    const timer = setTimeout(() => {
      saveToLocal();
      setPendingChanges(prev => prev + 1);
      
      if (isOnline) {
        syncToServer();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    setAutoSaveTimer(timer);
  };

  // Get current cell value for formula bar
  const getCurrentCellValue = () => {
    if (!selectedCell) return '';
    const row = filteredData.find(r => r.id === selectedCell.rowId);
    if (!row) return '';
    const column = columns.find(c => c.key === selectedCell.columnKey);
    if (!column) return '';
    
    // Show formula for formula columns
    if (column.type === 'formula' && column.formula) {
      return '=' + column.formula;
    }
    
    return row[selectedCell.columnKey] || '';
  };

  // Handle formula bar change
  const handleFormulaBarChange = (value) => {
    setFormulaBarValue(value);
  };

  // Handle formula bar key events
  const handleFormulaBarKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitFormulaEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelFormulaEdit();
    }
  };

  // Commit formula bar edit
  const commitFormulaEdit = () => {
    if (selectedCell && isEditingFormula) {
      updateCell(selectedCell.rowId, selectedCell.columnKey, formulaBarValue);
    }
    setIsEditingFormula(false);
  };

  // Cancel formula bar edit
  const cancelFormulaEdit = () => {
    setIsEditingFormula(false);
    setFormulaBarValue(getCurrentCellValue());
  };

  // Handle cell selection with range support
  const handleCellClick = (rowId, columnKey, event) => {
    const rowIndex = filteredData.findIndex(row => row.id === rowId);
    const colIndex = columns.findIndex(col => col.key === columnKey);
    
    if (event.shiftKey && selectedCell) {
      // Extend selection range
      const anchorRowIndex = filteredData.findIndex(row => row.id === selectedCell.rowId);
      const anchorColIndex = columns.findIndex(col => col.key === selectedCell.columnKey);
      
      setSelectionRange({
        startRow: Math.min(anchorRowIndex, rowIndex),
        endRow: Math.max(anchorRowIndex, rowIndex),
        startCol: Math.min(anchorColIndex, colIndex),
        endCol: Math.max(anchorColIndex, colIndex)
      });
    } else {
      // Single cell selection
      setSelectedCell({ rowId, columnKey });
      setSelectionRange(null);
    }
    
    // Update formula bar
    setIsEditingFormula(false);
  };

  // Handle mouse down for drag selection
  const handleMouseDown = (rowIndex, colIndex, event) => {
    event.preventDefault();
    setIsDragging(true);
    setDragStart({ rowIndex, colIndex });
    
    const rowId = filteredData[rowIndex]?.id;
    const columnKey = columns[colIndex]?.key;
    
    if (rowId && columnKey) {
      setSelectedCell({ rowId, columnKey });
      setSelectionRange(null);
    }
  };

  // Handle mouse enter during drag
  const handleMouseEnter = (rowIndex, colIndex) => {
    if (!isDragging || !dragStart) return;
    
    setSelectionRange({
      startRow: Math.min(dragStart.rowIndex, rowIndex),
      endRow: Math.max(dragStart.rowIndex, rowIndex),
      startCol: Math.min(dragStart.colIndex, colIndex),
      endCol: Math.max(dragStart.colIndex, colIndex)
    });
  };

  // Handle row header click
  const handleRowHeaderClick = (rowIndex, event) => {
    event.preventDefault();
    const rowId = filteredData[rowIndex]?.id;
    if (!rowId) return;
    
    setSelectedCell({ rowId, columnKey: columns[0]?.key });
    setSelectionRange({
      startRow: rowIndex,
      endRow: rowIndex,
      startCol: 0,
      endCol: columns.length - 1
    });
  };

  // Handle column header click
  const handleColumnHeaderClick = (colIndex, event) => {
    event.preventDefault();
    const columnKey = columns[colIndex]?.key;
    if (!columnKey) return;
    
    setSelectedCell({ rowId: filteredData[0]?.id, columnKey });
    setSelectionRange({
      startRow: 0,
      endRow: filteredData.length - 1,
      startCol: colIndex,
      endCol: colIndex
    });
  };

  // Check if cell is in selection range
  const isCellInRange = (rowIndex, colIndex) => {
    if (!selectionRange) return false;
    return rowIndex >= selectionRange.startRow && 
           rowIndex <= selectionRange.endRow &&
           colIndex >= selectionRange.startCol && 
           colIndex <= selectionRange.endCol;
  };

  // Get cell selection class
  const getCellSelectionClass = (rowId, columnKey, rowIndex, colIndex) => {
    const isSelected = selectedCell?.rowId === rowId && selectedCell?.columnKey === columnKey;
    const isInRange = isCellInRange(rowIndex, colIndex);
    
    if (isSelected) {
      return 'ring-2 ring-blue-500 ring-inset bg-blue-100';
    } else if (isInRange) {
      return 'bg-blue-100';
    }
    return 'hover:bg-blue-50';
  };

  // Copy selected cells to clipboard
  const copySelection = async () => {
    if (!selectedCell) return;
    
    let data = [];
    
    if (selectionRange) {
      // Copy range
      for (let r = selectionRange.startRow; r <= selectionRange.endRow; r++) {
        const row = filteredData[r];
        const rowData = [];
        for (let c = selectionRange.startCol; c <= selectionRange.endCol; c++) {
          const col = columns[c];
          rowData.push(row[col.key] || '');
        }
        data.push(rowData.join('\t'));
      }
    } else {
      // Copy single cell
      const rowIndex = filteredData.findIndex(row => row.id === selectedCell.rowId);
      const row = filteredData[rowIndex];
      data.push(row[selectedCell.columnKey] || '');
    }
    
    try {
      await navigator.clipboard.writeText(data.join('\n'));
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Paste from clipboard to selected cells
  const pasteSelection = async () => {
    if (!selectedCell) return;
    
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());
      
      const startRowIndex = filteredData.findIndex(row => row.id === selectedCell.rowId);
      const startColIndex = columns.findIndex(col => col.key === selectedCell.columnKey);
      
      if (startRowIndex === -1 || startColIndex === -1) return;
      
      rows.forEach((rowText, rowOffset) => {
        const cells = rowText.split('\t');
        const targetRowIndex = startRowIndex + rowOffset;
        
        if (targetRowIndex >= filteredData.length) return;
        
        const targetRow = filteredData[targetRowIndex];
        
        cells.forEach((cellValue, colOffset) => {
          const targetColIndex = startColIndex + colOffset;
          
          if (targetColIndex >= columns.length) return;
          
          const targetCol = columns[targetColIndex];
          
          if (targetCol.editable) {
            let value = cellValue;
            if (targetCol.type === 'number') {
              value = parseFloat(cellValue) || 0;
            }
            updateCell(targetRow.id, targetCol.key, value);
          }
        });
      });
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // Quick helper: stamp a picked product name into the selected Product cell
  const handleProductPick = (product) => {
    if (!product) return;
    const productName = typeof product === 'string' ? product : product?.name;
    if (!productName) return;
    const targetRowId = selectedCell?.rowId || filteredData[0]?.id;
    if (!targetRowId) return;

    const productColumn = columns.find(col => col.key === 'product');
    if (!productColumn) return;

    updateCell(targetRowId, 'product', productName);
    if (typeof product === 'object') {
      const imageUrl = getPrimaryProductImage(product);
      if (imageUrl) {
        updateCell(targetRowId, 'image', imageUrl);
      }
    }
    setSelectedCell({ rowId: targetRowId, columnKey: 'product' });
  };

  // Enhanced Undo/Redo functionality
  const saveToHistory = () => {
    const currentState = {
      tableData: JSON.parse(JSON.stringify(tableData)),
      columns: JSON.parse(JSON.stringify(columns)),
      cellFormats: JSON.parse(JSON.stringify(cellFormats)),
      rowFormats: JSON.parse(JSON.stringify(rowFormats))
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setTableData(prevState.tableData);
      setColumns(prevState.columns);
      setCellFormats(prevState.cellFormats || {});
      setRowFormats(prevState.rowFormats || {});
      setHistoryIndex(historyIndex - 1);
      scheduleAutoSave();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTableData(nextState.tableData);
      setColumns(nextState.columns);
      setCellFormats(nextState.cellFormats || {});
      setRowFormats(nextState.rowFormats || {});
      setHistoryIndex(historyIndex + 1);
      scheduleAutoSave();
    }
  };

  // Image upload handler
  const handleImageUpload = (rowId, columnKey, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateCell(rowId, columnKey, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Keyboard shortcuts for F1, F2, F3
  const handleGlobalKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'F1':
        e.preventDefault();
        // F1: Add product to cart (add new row)
        addRow();
        break;
      case 'F2':
        e.preventDefault();
        // F2: Print receipt
        printReceipt();
        break;
      case 'F3':
        e.preventDefault();
        // F3: Checkout and exit (save and close)
        checkoutAndExit();
        break;
      default:
        break;
    }
  }, []);

  // Print receipt function
  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Agricultural E-Commerce</h2>
            <p>Receipt - ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="items">
            ${tableData.map(row => `
              <div class="item">
                <span>${row.product || 'Unknown'} (x${row.quantity || 0})</span>
                <span>${new Intl.NumberFormat().format(row.total || 0)} UGX</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item">
              <span>Total:</span>
              <span>${new Intl.NumberFormat().format(tableData.reduce((sum, row) => sum + (row.total || 0), 0))} UGX</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  // Checkout and exit function
  const checkoutAndExit = () => {
    // Save data first
    saveToLocal();
    if (isOnline) {
      syncToServer();
    }
    
    // Show confirmation
    const total = tableData.reduce((sum, row) => sum + (row.total || 0), 0);
    const itemCount = tableData.reduce((sum, row) => sum + (row.quantity || 0), 0);
    
    if (window.confirm(`Checkout Summary:\n\nItems: ${itemCount}\nTotal: ${new Intl.NumberFormat().format(total)} UGX\n\nProceed with checkout?`)) {
      // Clear the table after checkout
      setTableData([]);
      alert('Checkout completed successfully!');
    }
  };
  const handleKeyDown = (e, rowId, columnKey) => {
    const currentRowIndex = filteredData.findIndex(row => row.id === rowId);
    const currentColIndex = columns.findIndex(col => col.key === columnKey);
    
    let newRowIndex = currentRowIndex;
    let newColIndex = currentColIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, currentRowIndex - 1);
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(filteredData.length - 1, currentRowIndex + 1);
        break;
      case 'ArrowLeft':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'ArrowRight':
        newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
        break;
      case 'Enter':
        newRowIndex = Math.min(filteredData.length - 1, currentRowIndex + 1);
        break;
      default:
        return;
    }
    
    e.preventDefault();
    const newRow = filteredData[newRowIndex];
    const newCol = columns[newColIndex];
    
    if (e.shiftKey && selectedCell) {
      // Extend selection range
      const anchorRowIndex = filteredData.findIndex(row => row.id === selectedCell.rowId);
      const anchorColIndex = columns.findIndex(col => col.key === selectedCell.columnKey);
      
      setSelectionRange({
        startRow: Math.min(anchorRowIndex, newRowIndex),
        endRow: Math.max(anchorRowIndex, newRowIndex),
        startCol: Math.min(anchorColIndex, newColIndex),
        endCol: Math.max(anchorColIndex, newColIndex)
      });
    } else {
      // Single cell navigation
      setSelectedCell({ rowId: newRow.id, columnKey: newCol.key });
      setSelectionRange(null);
    }
  };

  // Save data
  const saveData = async () => {
    setIsLoading(true);
    try {
      // Simulate save
      setTimeout(() => {
        alert('Data saved successfully!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Data stored locally.');
      setIsLoading(false);
    }
  };

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate load
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Load failed:', error);
      setIsLoading(false);
    }
  };

  // Export to CSV
  const exportData = () => {
    const csv = [
      columns.map(col => col.label).join(','),
      ...filteredData.map(row => 
        columns.map(col => {
          let value = row[col.key] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manual_entry_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = { id: Math.max(...tableData.map(r => r.id), 0) + index + 1 };
          
          headers.forEach((header, i) => {
            const column = columns.find(col => col.label === header);
            if (column) {
              let value = values[i] || '';
              if (column.type === 'number') {
                value = parseFloat(value) || 0;
              } else if (column.type === 'date') {
                value = value || new Date().toISOString().split('T')[0];
              }
              row[column.key] = value;
            }
          });
          
          return row;
        });

        setTableData([...tableData, ...rows]);
        alert(`Imported ${rows.length} rows successfully!`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Bulk operations
  const bulkUpdateStatus = (newStatus) => {
    const updatedData = tableData.map(row => ({ ...row, status: newStatus }));
    setTableData(updatedData);
  };

  // Context menu handler
  const handleContextMenu = (e, rowId, columnKey) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowId,
      columnKey
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    loadFromLocal();
    // Initialize history with current state
    saveToHistory();
    document.addEventListener('click', closeContextMenu);
    document.addEventListener('keydown', handleGlobalKeyDown); // Add global keyboard shortcuts
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCell(null);
        setSelectionRange(null);
      }
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingChanges > 0) {
        syncToServer();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      document.removeEventListener('click', closeContextMenu);
      document.removeEventListener('keydown', handleGlobalKeyDown); // Remove global keyboard shortcuts
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          copySelection();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteSelection();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, selectionRange, filteredData, columns, historyIndex, history, tableData, cellFormats, rowFormats]);

  return (
    <div className="p-4 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manual Entry</h1>
          <p className="text-gray-600">Excel-like data entry with real-time sync</p>
          <div className="text-sm text-blue-600 mt-1">
            <span className="font-medium">Shortcuts:</span> F1 - Add Product | F2 - Print Receipt | F3 - Checkout & Exit
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <div className={`px-2 py-1 rounded ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {pendingChanges > 0 && (
            <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              {pendingChanges} pending
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" />
              Syncing...
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded">
              Sync Error
            </div>
          )}
          {syncStatus === 'success' && (
            <div className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Synced
            </div>
          )}
          {lastSaved && (
            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Available products from catalog */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold">Products (live)</h3>
            <p className="text-sm text-gray-600">Click a product to fill the selected Product cell.</p>
          </div>
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={productsLoading}
          >
            <RefreshCw size={16} className={productsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {productsError && (
          <div className="text-sm text-red-600 mb-2">{productsError}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(productsLoading ? Array.from({ length: 6 }) : products.slice(0, 9)).map((product, idx) => (
            <button
              key={product?.id || idx}
              type="button"
              onClick={() => product && handleProductPick(product)}
              className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 text-left hover:border-blue-400 disabled:cursor-not-allowed"
              disabled={!product}
            >
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {(() => {
                  let imgSrc = getPrimaryProductImage(product);
                  if (!imgSrc) imgSrc = '/placeholder-product.png';
                  return (
                    <img
                      src={imgSrc}
                      alt={product?.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = '/placeholder-product.png'; }}
                    />
                  );
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{product?.name || 'Loading...'}</div>
                <div className="text-sm text-gray-600">Stock: {product?.stock ?? '—'}</div>
              </div>
            </button>
          ))}
        </div>
        {products.length === 0 && !productsLoading && !productsError && (
          <div className="text-sm text-gray-600 mt-2">No products returned. Add products on the Products page first.</div>
        )}
      </div>

      {/* Order Status Cards - Temporarily disabled */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Order Status</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{orderCounts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{orderCounts.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{orderCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{orderCounts.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="F1 - Add Product to Cart"
          >
            <Plus size={16} />
            Add Row (F1)
          </button>
          
          <button
            onClick={printReceipt}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            title="F2 - Print Receipt"
          >
            <Download size={16} />
            Print Receipt (F2)
          </button>
          
          <button
            onClick={checkoutAndExit}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="F3 - Checkout and Exit"
          >
            <Save size={16} />
            Checkout & Exit (F3)
          </button>
          
          <button
            onClick={addColumn}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Plus size={16} />
            Add Column
          </button>
          
          <button
            onClick={() => {
              saveToLocal();
              if (isOnline) syncToServer();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            <Save size={16} />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Save'}
          </button>
          
          <button
            onClick={forceSync}
            disabled={!isOnline || pendingChanges === 0}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            Sync ({pendingChanges})
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <Download size={16} />
            Export CSV
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer">
            <Upload size={16} />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={importData}
              className="hidden"
            />
          </label>
          
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Undo
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Redo
          </button>

          <button
            onClick={() => setShowFormatPanel(!showFormatPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            <Palette size={16} />
            Format
          </button>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Filter by...</option>
              {columns.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
            {filterColumn && (
              <input
                type="text"
                value={filterValue}
                onChange={async (e) => {
                  setFilterValue(e.target.value);
                  if (filterColumn === 'image' && e.target.value) {
                    await fetchProductsByImageSearch(e.target.value, setTableData, setProductsError);
                  }
                }}
                placeholder="Filter value"
                className="px-2 py-1 border rounded text-sm"
              />
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc size={16} />
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">Sort by...</option>
              {columns.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
            {sortColumn && (
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 border rounded text-sm"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <Calculator size={16} />
            <select
              onChange={(e) => e.target.value && bulkUpdateStatus(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              defaultValue=""
            >
              <option value="">Bulk Status...</option>
              <option value="Pending">Set All Pending</option>
              <option value="Confirmed">Set All Confirmed</option>
              <option value="Completed">Set All Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formatting Panel Modal */}
      {showFormatPanel && selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Format Cells</h3>
              <button
                onClick={() => setShowFormatPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Text Styling */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Text Style</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { fontWeight: 'bold' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { fontStyle: 'italic' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { textDecoration: 'underline' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Underline"
                >
                  <Underline size={16} />
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Font Size</h4>
              <select
                onChange={(e) => formatCell(selectedCell.rowId, selectedCell.columnKey, { fontSize: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                defaultValue=""
              >
                <option value="">Default</option>
                <option value="10px">10px</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>
            </div>

            {/* Text Alignment */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Text Alignment</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { textAlign: 'left' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { textAlign: 'center' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => formatCell(selectedCell.rowId, selectedCell.columnKey, { textAlign: 'right' })}
                  className="p-2 border rounded hover:bg-gray-100" title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Text Color</label>
                  <input
                    type="color"
                    onChange={(e) => formatCell(selectedCell.rowId, selectedCell.columnKey, { color: e.target.value })}
                    className="w-full h-8 border rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Cell Background</label>
                  <input
                    type="color"
                    onChange={(e) => formatCell(selectedCell.rowId, selectedCell.columnKey, { backgroundColor: e.target.value })}
                    className="w-full h-8 border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Row Formatting */}
            <div className="mb-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Row Formatting</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Row Background</label>
                  <input
                    type="color"
                    onChange={(e) => formatRow(selectedCell.rowId, { backgroundColor: e.target.value })}
                    className="w-full h-8 border rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Row Height</label>
                  <select
                    onChange={(e) => formatRow(selectedCell.rowId, { height: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    defaultValue=""
                  >
                    <option value="">Default</option>
                    <option value="32px">Small</option>
                    <option value="40px">Medium</option>
                    <option value="48px">Large</option>
                    <option value="56px">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => {
                  formatCell(selectedCell.rowId, selectedCell.columnKey, {});
                  formatRow(selectedCell.rowId, {});
                }}
                className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                Clear Formatting
              </button>
              <button
                onClick={() => setShowFormatPanel(false)}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Ribbon Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center gap-4 text-sm">
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              applyFormatting({ fontFamily: e.target.value });
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs w-24"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              applyFormatting({ fontSize: e.target.value + 'px' });
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs w-12"
          >
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
          </select>

          {/* Text Formatting */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => toggleFormatting('fontWeight', 'bold')}
              className={`px-2 py-1 border-r border-gray-300 ${
                getCurrentCellFormat().fontWeight === 'bold' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => toggleFormatting('fontStyle', 'italic')}
              className={`px-2 py-1 border-r border-gray-300 ${
                getCurrentCellFormat().fontStyle === 'italic' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => toggleFormatting('textDecoration', 'underline')}
              className={`px-2 py-1 ${
                getCurrentCellFormat().textDecoration === 'underline' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Underline"
            >
              <Underline size={14} />
            </button>
          </div>

          {/* Colors */}
          <div className="flex gap-1">
            <input
              type="color"
              onChange={(e) => applyFormatting({ color: e.target.value })}
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
              title="Text Color"
            />
            <input
              type="color"
              onChange={(e) => applyFormatting({ backgroundColor: e.target.value })}
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
              title="Fill Color"
            />
          </div>

          {/* Alignment */}
          <div className="flex border border-gray-300 rounded">
            <button
              onClick={() => applyFormatting({ textAlign: 'left' })}
              className={`px-2 py-1 border-r border-gray-300 ${
                getCurrentCellFormat().textAlign === 'left' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => applyFormatting({ textAlign: 'center' })}
              className={`px-2 py-1 border-r border-gray-300 ${
                getCurrentCellFormat().textAlign === 'center' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => applyFormatting({ textAlign: 'right' })}
              className={`px-2 py-1 ${
                getCurrentCellFormat().textAlign === 'right' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-600 w-8">
            {selectedCell ? (
              `${getColumnLetter(columns.findIndex(c => c.key === selectedCell.columnKey))}${filteredData.findIndex(r => r.id === selectedCell.rowId) + 1}`
            ) : ''}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={isEditingFormula ? formulaBarValue : getCurrentCellValue()}
              onChange={(e) => handleFormulaBarChange(e.target.value)}
              onKeyDown={handleFormulaBarKeyDown}
              onFocus={() => {
                setIsEditingFormula(true);
                setFormulaBarValue(getCurrentCellValue());
              }}
              onBlur={commitFormulaEdit}
              placeholder={selectedCell ? 'Enter value or formula...' : 'Select a cell to edit'}
              disabled={!selectedCell}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Excel-like Editable Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-auto" ref={tableRef}>
          <table className="w-full border-collapse">
            {/* Column Letters Header */}
            <thead>
              <tr className="bg-gray-100">
                <th className="w-12 h-5 border border-gray-300 bg-gray-200"></th>
                {columns.map((column, colIndex) => (
                  <th key={`letter-${column.key}`} className="min-w-20 h-5 border border-gray-300 bg-gray-100 text-xs font-normal text-gray-700 text-center">
                    {getColumnLetter(colIndex)}
                  </th>
                ))}
                <th className="w-16 h-5 border border-gray-300 bg-gray-200"></th>
              </tr>
              {/* Column Headers */}
              <tr className="bg-gray-50 sticky top-0">
                <th className="w-12 px-1 py-1 border border-gray-300 text-xs text-gray-500 bg-gray-200">#</th>
                {columns.map((column, colIndex) => (
                  <th 
                    key={column.key} 
                    className="relative group border border-gray-300 min-w-20 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none"
                    onMouseDown={(e) => handleColumnHeaderClick(colIndex, e)}
                  >
                    <div className="flex items-center justify-between p-1">
                      <input
                        type="text"
                        value={column.label}
                        onChange={(e) => updateColumnHeader(column.key, e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-medium text-gray-700 w-full text-center"
                      />
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() => addColumn(colIndex)}
                          className="text-green-500 hover:text-green-700 p-1"
                          title="Insert column"
                        >
                          <Plus size={10} />
                        </button>
                        <button
                          onClick={() => deleteColumn(column.key)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete column"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="w-16 px-1 py-1 border border-gray-300 text-xs text-gray-500 bg-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr key={row.id} className="group hover:bg-blue-25">
                  {/* Row Number */}
                  <td 
                    className="px-1 py-0 border border-gray-300 text-xs text-gray-600 bg-gray-100 text-center font-normal hover:bg-gray-200 cursor-pointer select-none"
                    onMouseDown={(e) => handleRowHeaderClick(rowIndex, e)}
                  >
                    <div className="flex items-center justify-center h-6">
                      <span>{rowIndex + 1}</span>
                      <button
                        onClick={() => addRow(rowIndex)}
                        className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 ml-1"
                        title="Insert row"
                      >
                        <Plus size={8} />
                      </button>
                    </div>
                  </td>
                  {columns.map((column, colIndex) => {
                    const cellStyle = getCellStyle(row.id, column.key);
                    const isSelected = selectedCell?.rowId === row.id && selectedCell?.columnKey === column.key;
                    
                    return (
                      <td 
                        key={column.key} 
                        className={`border border-gray-300 p-0 relative h-6 ${getCellSelectionClass(row.id, column.key, rowIndex, colIndex)}`}
                        style={cellStyle}
                        onContextMenu={(e) => handleContextMenu(e, row.id, column.key)}
                        onMouseDown={(e) => {
                          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                            handleMouseDown(rowIndex, colIndex, e);
                          }
                        }}
                        onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                        onClick={(e) => {
                          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                            handleCellClick(row.id, column.key, e);
                          }
                        }}
                      >
                        {column.editable ? (
                          column.type === 'image' ? (
                            <div className="p-1">
                              {(() => {
                                const imageSrc = resolveImageUrl(row[column.key]);
                                if (imageSrc) {
                                  return (
                                    <img
                                      src={imageSrc}
                                      alt="Cell content"
                                      className="max-w-full h-8 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/placeholder-product.png';
                                      }}
                                    />
                                  );
                                }
                                return (
                                  <label className="cursor-pointer flex items-center justify-center h-8">
                                    <Image size={16} className="text-gray-400" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => e.target.files[0] && handleImageUpload(row.id, column.key, e.target.files[0])}
                                      className="hidden"
                                    />
                                  </label>
                                );
                              })()}
                            </div>
                          ) : column.type === 'dropdown' ? (
                            <select
                              value={row[column.key] || ''}
                              onChange={(e) => updateCell(row.id, column.key, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
                              style={cellStyle}
                              className="w-full h-6 px-1 py-0 border-none outline-none bg-transparent text-xs focus:bg-white"
                            >
                              <option value="">Select...</option>
                              {column.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : column.type === 'date' ? (
                            <input
                              type="date"
                              value={row[column.key] || ''}
                              onChange={(e) => updateCell(row.id, column.key, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
                              style={cellStyle}
                              className="w-full h-6 px-1 py-0 border-none outline-none bg-transparent text-xs focus:bg-white"
                            />
                          ) : column.type === 'number' ? (
                            <input
                              type="number"
                              value={row[column.key] || ''}
                              onChange={(e) => updateCell(row.id, column.key, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
                              style={cellStyle}
                              className="w-full h-6 px-1 py-0 border-none outline-none bg-transparent text-xs text-right focus:bg-white"
                            />
                          ) : (
                            <input
                              type="text"
                              value={row[column.key] || ''}
                              onChange={(e) => updateCell(row.id, column.key, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
                              onFocus={() => setSelectedCell({ rowId: row.id, columnKey: column.key })}
                              style={cellStyle}
                              className="w-full h-6 px-1 py-0 border-none outline-none bg-transparent text-xs focus:bg-white"
                            />
                          )
                        ) : (
                          <div className="px-1 py-0 h-6 flex items-center text-xs text-gray-700" style={cellStyle}>
                            {(() => {
                              const imageSrc = resolveImageUrl(row[column.key]);
                              if (imageSrc) {
                                return (
                                  <img
                                    src={imageSrc}
                                    alt="Cell content"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/placeholder-product.png';
                                    }}
                                  />
                                );
                              }
                              if (typeof row[column.key] === 'number') {
                                return new Intl.NumberFormat().format(row[column.key]);
                              }
                              return row[column.key];
                            })()}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-1 py-0 border border-gray-300 text-center bg-gray-50">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-red-500 hover:text-red-700 p-1 h-6 flex items-center justify-center"
                      title="Delete row"
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Add row at bottom */}
              <tr>
                <td colSpan={columns.length + 2} className="border border-gray-300 p-1 text-center bg-gray-50">
                  <button
                    onClick={() => addRow()}
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1 mx-auto text-xs"
                  >
                    <Plus size={12} />
                    Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white border shadow-lg rounded z-50 py-2"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              addRow(tableData.findIndex(row => row.id === contextMenu.rowId));
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Insert Row Above
          </button>
          <button
            onClick={() => {
              addColumn(columns.findIndex(col => col.key === contextMenu.columnKey));
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Insert Column Left
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                if (e.target.files[0]) {
                  handleImageUpload(contextMenu.rowId, contextMenu.columnKey, e.target.files[0]);
                }
              };
              input.click();
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <Image size={14} />
            Insert Image
          </button>
          <button
            onClick={() => {
              deleteRow(contextMenu.rowId);
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            Delete Row
          </button>
          <button
            onClick={() => {
              deleteColumn(contextMenu.columnKey);
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            Delete Column
          </button>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-600">Total Revenue</p>
            <p className="text-xl font-bold text-blue-700">
              {new Intl.NumberFormat().format(
                tableData.reduce((sum, row) => sum + (row.total || 0), 0)
              )} UGX
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-green-600">Avg Order Value</p>
            <p className="text-xl font-bold text-green-700">
              {new Intl.NumberFormat().format(
                tableData.length > 0 
                  ? tableData.reduce((sum, row) => sum + (row.total || 0), 0) / tableData.length 
                  : 0
              )} UGX
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-sm text-purple-600">Total Items</p>
            <p className="text-xl font-bold text-purple-700">
              {tableData.reduce((sum, row) => sum + (row.quantity || 0), 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-sm text-yellow-600">Completion Rate</p>
            <p className="text-xl font-bold text-yellow-700">
              {tableData.length > 0 
                ? Math.round((tableData.filter(row => row.status === 'Completed').length / tableData.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart 
          data={[
            { label: 'Pending', value: orderCounts.pending },
            { label: 'Confirmed', value: orderCounts.confirmed },
            { label: 'Completed', value: orderCounts.completed }
          ]}
          type="pie"
          title="Order Status Distribution"
        />
        
        <SimpleChart 
          data={tableData.slice(0, 5).map(row => ({
            label: row.product || 'Unknown',
            value: row.total || 0
          }))}
          type="bar"
          title="Top Products by Revenue"
        />
      </div>
    </div>
  );
}

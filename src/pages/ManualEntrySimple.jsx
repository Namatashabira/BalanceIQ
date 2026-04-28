import React, { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';

export default function ManualEntrySimple() {
  const [tableData, setTableData] = useState([
    {
      id: 1,
      product: 'Coffee Beans',
      quantity: 10,
      price: 25000,
      status: 'Pending',
      date: '2024-01-15',
      total: 250000
    }
  ]);

  const [columns] = useState([
    { key: 'id', label: 'ID', type: 'number', editable: false },
    { key: 'product', label: 'Product', type: 'text', editable: true },
    { key: 'quantity', label: 'Quantity', type: 'number', editable: true },
    { key: 'price', label: 'Price (UGX)', type: 'number', editable: true },
    { key: 'status', label: 'Status', type: 'dropdown', options: ['Pending', 'Confirmed', 'Completed'], editable: true },
    { key: 'date', label: 'Date', type: 'date', editable: true },
    { key: 'total', label: 'Total', type: 'number', editable: false }
  ]);

  const addRow = () => {
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
    setTableData([...tableData, newRow]);
  };

  const deleteRow = (id) => {
    setTableData(tableData.filter(row => row.id !== id));
  };

  const updateCell = (rowId, columnKey, value) => {
    setTableData(prevData => 
      prevData.map(row => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [columnKey]: value };
          // Calculate total if quantity or price changes
          if (columnKey === 'quantity' || columnKey === 'price') {
            updatedRow.total = (updatedRow.quantity || 0) * (updatedRow.price || 0);
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manual Entry</h1>
          <p className="text-gray-600">Simple data entry interface</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-center">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={16} />
            Add Row
          </button>
          
          <button
            onClick={() => alert('Save functionality would go here')}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="border border-gray-300 p-2 text-left">
                    {column.label}
                  </th>
                ))}
                <th className="border border-gray-300 p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {columns.map(column => (
                    <td key={column.key} className="border border-gray-300 p-0">
                      {column.editable ? (
                        column.type === 'dropdown' ? (
                          <select
                            value={row[column.key] || ''}
                            onChange={(e) => updateCell(row.id, column.key, e.target.value)}
                            className="w-full h-full px-2 py-1 border-none outline-none"
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
                            className="w-full h-full px-2 py-1 border-none outline-none"
                          />
                        ) : column.type === 'number' ? (
                          <input
                            type="number"
                            value={row[column.key] || ''}
                            onChange={(e) => updateCell(row.id, column.key, parseFloat(e.target.value) || 0)}
                            className="w-full h-full px-2 py-1 border-none outline-none text-right"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row[column.key] || ''}
                            onChange={(e) => updateCell(row.id, column.key, e.target.value)}
                            className="w-full h-full px-2 py-1 border-none outline-none"
                          />
                        )
                      ) : (
                        <div className="px-2 py-1 bg-gray-50 text-gray-600">
                          {typeof row[column.key] === 'number' 
                            ? new Intl.NumberFormat().format(row[column.key])
                            : row[column.key]
                          }
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
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
            <p className="text-sm text-green-600">Total Items</p>
            <p className="text-xl font-bold text-green-700">
              {tableData.reduce((sum, row) => sum + (row.quantity || 0), 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-sm text-purple-600">Pending Orders</p>
            <p className="text-xl font-bold text-purple-700">
              {tableData.filter(row => row.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-sm text-yellow-600">Total Rows</p>
            <p className="text-xl font-bold text-yellow-700">
              {tableData.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
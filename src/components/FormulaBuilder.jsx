import React, { useState, useRef, useEffect } from 'react';
import { Calculator, X, Check, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function FormulaBuilder({ 
  isOpen, 
  onClose, 
  onSave, 
  initialFormula = '', 
  columns = [],
  columnKey = ''
}) {
  const toast = useToast();
  const [formula, setFormula] = useState(initialFormula);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const inputRef = useRef(null);

  const functions = [
    { name: 'SUM', description: 'Sum of values', syntax: 'SUM(col1,col2,...)' },
    { name: 'AVERAGE', description: 'Average of values', syntax: 'AVERAGE(col1,col2,...)' },
    { name: 'COUNT', description: 'Count non-empty values', syntax: 'COUNT(col1,col2,...)' },
    { name: 'MAX', description: 'Maximum value', syntax: 'MAX(col1,col2,...)' },
    { name: 'MIN', description: 'Minimum value', syntax: 'MIN(col1,col2,...)' },
    { name: 'IF', description: 'Conditional logic', syntax: 'IF(condition,true_value,false_value)' }
  ];

  const operators = ['+', '-', '*', '/', '(', ')', '>', '<', '>=', '<=', '==', '!='];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    validateFormula(formula);
  }, [formula, columns]);

  const validateFormula = (formulaText) => {
    if (!formulaText.trim()) {
      setError('');
      setPreview('');
      return;
    }

    try {
      // Create a test object with sample data
      const testData = {};
      columns.forEach(col => {
        if (col.type === 'number') {
          testData[col.key] = 10;
        } else if (col.type === 'text') {
          testData[col.key] = 'test';
        } else {
          testData[col.key] = 1;
        }
      });

      let testFormula = formulaText;

      // Replace column references
      columns.forEach(col => {
        const regex = new RegExp(`\\b${col.key}\\b`, 'g');
        testFormula = testFormula.replace(regex, testData[col.key] || 0);
      });

      // Handle functions
      testFormula = testFormula.replace(/SUM\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(arg => parseFloat(arg.trim()) || 0);
        return values.reduce((sum, val) => sum + val, 0);
      });

      testFormula = testFormula.replace(/AVERAGE\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(arg => parseFloat(arg.trim()) || 0);
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      });

      testFormula = testFormula.replace(/COUNT\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(arg => arg.trim()).filter(val => val !== '');
        return values.length;
      });

      testFormula = testFormula.replace(/MAX\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(arg => parseFloat(arg.trim()) || 0);
        return Math.max(...values);
      });

      testFormula = testFormula.replace(/MIN\(([^)]+)\)/g, (match, args) => {
        const values = args.split(',').map(arg => parseFloat(arg.trim()) || 0);
        return Math.min(...values);
      });

      // Simple IF function
      testFormula = testFormula.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/g, (match, condition, trueVal, falseVal) => {
        const conditionResult = Function('return ' + condition.trim())();
        return conditionResult ? trueVal.trim() : falseVal.trim();
      });

      // Evaluate the formula
      const result = Function('"use strict"; return (' + testFormula + ')')();
      setPreview(`Preview: ${result}`);
      setError('');
    } catch (err) {
      setError(`Invalid formula: ${err.message}`);
      setPreview('');
    }
  };

  const insertText = (text) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newFormula = formula.substring(0, start) + text + formula.substring(end);
      setFormula(newFormula);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + text.length;
        input.focus();
      }, 0);
    }
  };

  const handleSave = () => {
    if (error) {
      toast.warning('Please fix the formula error before saving.');
      return;
    }
    onSave(formula);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold">Formula Builder</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Formula Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formula for column: {columns.find(c => c.key === columnKey)?.label || columnKey}
            </label>
            <textarea
              ref={inputRef}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:ring-2 focus:border-transparent`}
              rows={3}
              placeholder="Enter formula (e.g., quantity * price, SUM(col1,col2), IF(quantity>10,price*0.9,price))"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <X size={14} />
                {error}
              </p>
            )}
            {preview && !error && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <Check size={14} />
                {preview}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Available Columns */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Available Columns</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {columns.filter(col => col.key !== columnKey).map(column => (
                  <button
                    key={column.key}
                    onClick={() => insertText(column.key)}
                    className="w-full text-left px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    title={`Insert ${column.label} (${column.type})`}
                  >
                    <span className="font-mono text-blue-600">{column.key}</span>
                    <span className="text-gray-600 ml-2">({column.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Functions</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {functions.map(func => (
                  <button
                    key={func.name}
                    onClick={() => insertText(`${func.name}()`)}
                    className="w-full text-left px-2 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
                    title={func.description}
                  >
                    <div className="font-mono text-blue-600">{func.name}()</div>
                    <div className="text-xs text-gray-600">{func.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Operators */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Operators</h4>
              <div className="grid grid-cols-4 gap-1">
                {operators.map(op => (
                  <button
                    key={op}
                    onClick={() => insertText(op)}
                    className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded font-mono"
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="text-blue-500 mt-0.5" size={16} />
              <div className="text-sm">
                <h5 className="font-medium text-blue-700 mb-1">Formula Help</h5>
                <ul className="text-blue-600 space-y-1">
                  <li>• Use column names directly in formulas (e.g., quantity * price)</li>
                  <li>• Functions: SUM(col1,col2), AVERAGE(col1,col2), MAX(col1,col2), MIN(col1,col2)</li>
                  <li>• Conditional: IF(condition, true_value, false_value)</li>
                  <li>• Operators: +, -, *, /, &gt;, &lt;, &gt;=, &lt;=, ==, !=</li>
                  <li>• Example: IF(quantity &gt; 10, price * 0.9, price)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!error}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Formula
          </button>
        </div>
      </div>
    </div>
  );
}
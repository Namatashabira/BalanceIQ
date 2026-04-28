import { useState, useEffect, useCallback } from 'react';
import { DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { fetchBalanceSheet, fetchAssets, fetchLiabilities, fetchEquity } from '../../api/accounting';
import { useToast } from '../../context/ToastContext';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';

export default function BalanceSheet() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [equity, setEquity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sheetData, assetsData, liabilitiesData, equityData] = await Promise.all([
        fetchBalanceSheet(),
        fetchAssets(),
        fetchLiabilities(),
        fetchEquity(),
      ]);
      setData(sheetData);
      setAssets(assetsData);
      setLiabilities(liabilitiesData);
      setEquity(equityData);
    } catch (error) {
      console.error('Failed to load balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    toast.info('PDF export functionality would be implemented here');
  };

  const exportToExcel = () => {
    toast.info('Excel export functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Loading balance sheet...</p>
      </div>
    );
  }

  const totalAssets = parseFloat(data?.total_assets || 0);
  const totalLiabilities = parseFloat(data?.total_liabilities || 0);
  const totalEquity = parseFloat(data?.total_equity || 0);
  const isBalanced = data?.is_balanced || false;

  // Group assets by type
  const currentAssets = assets.filter(a => a.asset_type === 'current_asset');
  const fixedAssets = assets.filter(a => a.asset_type === 'fixed_asset');
  const intangibleAssets = assets.filter(a => a.asset_type === 'intangible_asset');

  // Group liabilities by type
  const currentLiabilities = liabilities.filter(l => l.liability_type === 'current_liability');
  const longTermLiabilities = liabilities.filter(l => l.liability_type === 'long_term_liability');

  // Group equity by type
  const capital = equity.filter(e => e.equity_type === 'capital');
  const retainedEarnings = equity.filter(e => e.equity_type === 'retained_earnings');
  const draws = equity.filter(e => e.equity_type === 'draws');

  const sumValues = (items) => items.reduce((sum, item) => sum + parseFloat(item.amount || item.value || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Balance Sheet</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Snapshot of financial position</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className={`p-4 rounded-lg border-2 ${isBalanced ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            ) : (
              <XCircleIcon className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${isBalanced ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                {isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is Not Balanced'}
              </h3>
              <p className={`text-sm ${isBalanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                Assets: {fmt(totalAssets)} | Liabilities + Equity: {fmt(totalLiabilities + totalEquity)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Assets</p>
            <p className="text-3xl font-bold text-blue-600">{fmt(totalAssets)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Liabilities</p>
            <p className="text-3xl font-bold text-red-600">{fmt(totalLiabilities)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Equity</p>
            <p className="text-3xl font-bold text-green-600">{fmt(totalEquity)}</p>
          </div>
        </div>

        {/* Detailed Balance Sheet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Assets</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Current Assets */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Assets</h4>
                <div className="pl-4 space-y-2">
                  {currentAssets.length > 0 ? (
                    currentAssets.map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">{asset.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(asset.value))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No current assets</div>
                  )}
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Current Assets</span>
                    <span className="text-blue-600">{fmt(sumValues(currentAssets))}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Fixed Assets</h4>
                <div className="pl-4 space-y-2">
                  {fixedAssets.length > 0 ? (
                    fixedAssets.map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">{asset.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(asset.value))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No fixed assets</div>
                  )}
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Fixed Assets</span>
                    <span className="text-blue-600">{fmt(sumValues(fixedAssets))}</span>
                  </div>
                </div>
              </div>

              {/* Intangible Assets */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Intangible Assets</h4>
                <div className="pl-4 space-y-2">
                  {intangibleAssets.length > 0 ? (
                    intangibleAssets.map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">{asset.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(asset.value))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No intangible assets</div>
                  )}
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Intangible Assets</span>
                    <span className="text-blue-600">{fmt(sumValues(intangibleAssets))}</span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="pt-4 border-t-2 border-blue-400 dark:border-blue-600">
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">TOTAL ASSETS</span>
                  <span className="text-2xl font-bold text-blue-600">{fmt(totalAssets)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Liabilities & Equity</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Current Liabilities */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Liabilities</h4>
                <div className="pl-4 space-y-2">
                  {currentLiabilities.length > 0 ? (
                    currentLiabilities.map((liability) => (
                      <div key={liability.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">{liability.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(liability.amount))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No current liabilities</div>
                  )}
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Current Liabilities</span>
                    <span className="text-red-600">{fmt(sumValues(currentLiabilities))}</span>
                  </div>
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Long-term Liabilities</h4>
                <div className="pl-4 space-y-2">
                  {longTermLiabilities.length > 0 ? (
                    longTermLiabilities.map((liability) => (
                      <div key={liability.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">{liability.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(liability.amount))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No long-term liabilities</div>
                  )}
                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">Total Long-term Liabilities</span>
                    <span className="text-red-600">{fmt(sumValues(longTermLiabilities))}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center py-2 font-semibold">
                  <span className="text-gray-900 dark:text-white">TOTAL LIABILITIES</span>
                  <span className="text-xl text-red-600">{fmt(totalLiabilities)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="pt-4 border-t-2 border-gray-400 dark:border-gray-600">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Owner's Equity</h4>
                <div className="pl-4 space-y-2">
                  {/* Capital */}
                  {capital.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Capital</div>
                      {capital.map((eq) => (
                        <div key={eq.id} className="flex justify-between items-center py-1 pl-4 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{eq.description || 'Capital contribution'}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(eq.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Retained Earnings */}
                  {retainedEarnings.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Retained Earnings</div>
                      {retainedEarnings.map((eq) => (
                        <div key={eq.id} className="flex justify-between items-center py-1 pl-4 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{eq.description || 'Retained earnings'}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{fmt(parseFloat(eq.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draws */}
                  {draws.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner Draws</div>
                      {draws.map((eq) => (
                        <div key={eq.id} className="flex justify-between items-center py-1 pl-4 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{eq.description || 'Owner draw'}</span>
                          <span className="font-semibold text-red-600">{fmt(-parseFloat(eq.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {equity.length === 0 && (
                    <div className="text-gray-500 dark:text-gray-400 py-2">No equity records</div>
                  )}

                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">TOTAL EQUITY</span>
                    <span className="text-xl text-green-600">{fmt(totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities + Equity */}
              <div className="pt-4 border-t-2 border-red-400 dark:border-red-600">
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">TOTAL LIABILITIES + EQUITY</span>
                  <span className="text-2xl font-bold text-red-600">{fmt(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

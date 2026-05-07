import React, { useState } from 'react';
import { DollarSign, TrendingUp, Scale, CreditCard, GraduationCap } from 'lucide-react';
import SchoolExpenses from './SchoolExpenses';
import SchoolProfits from './SchoolProfits';
import SchoolBalanceSheet from './SchoolBalanceSheet';
import SchoolPayments from './SchoolPayments';

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: DollarSign, color: 'text-red-600' },
  { id: 'profits', label: 'Profits', icon: TrendingUp, color: 'text-green-600' },
  { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale, color: 'text-blue-600' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-indigo-600' },
];

export default function SchoolAccounting() {
  const [activeTab, setActiveTab] = useState('expenses');

  const renderTab = () => {
    switch (activeTab) {
      case 'expenses': return <SchoolExpenses />;
      case 'profits': return <SchoolProfits />;
      case 'balance-sheet': return <SchoolBalanceSheet />;
      case 'payments': return <SchoolPayments />;
      default: return <SchoolExpenses />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">School Accounting</h1>
            <p className="text-sm text-gray-500">Manage school finances, expenses, income, and payments</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-medium text-sm transition-all border-b-2 ${
                  isActive
                    ? `border-blue-600 bg-blue-50 text-blue-700`
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : tab.color} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>{renderTab()}</div>
    </div>
  );
}

import { createContext, useContext, useState, useCallback } from 'react';
import {
  fetchExpenses,
  fetchPayments,
  fetchTaxes,
  fetchExpenseCategories,
  fetchPaymentSummary,
  fetchTaxSummary,
} from '../api/accounting';

// Create the context
const AccountingContext = createContext(null);

export const AccountingProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [taxSummary, setTaxSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refresh Expenses
  const refreshExpenses = useCallback(async () => {
    try {
      const data = await fetchExpenses();
      setExpenses(data);
      return data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }, []);

  // Refresh Payments
  const refreshPayments = useCallback(async () => {
    try {
      const [paymentsData, summaryData] = await Promise.all([
        fetchPayments(),
        fetchPaymentSummary(),
      ]);
      setPayments(paymentsData);
      setPaymentSummary(summaryData);
      return paymentsData;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }, []);

  // Refresh Taxes
  const refreshTaxes = useCallback(async () => {
    try {
      const [taxesData, summaryData] = await Promise.all([
        fetchTaxes(),
        fetchTaxSummary(),
      ]);
      setTaxes(taxesData);
      setTaxSummary(summaryData);
      return taxesData;
    } catch (error) {
      console.error('Error fetching taxes:', error);
      throw error;
    }
  }, []);

  // Refresh Expense Categories
  const refreshExpenseCategories = useCallback(async () => {
    try {
      const data = await fetchExpenseCategories();
      setExpenseCategories(data);
      return data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  }, []);

  // Refresh all accounting data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshExpenses(),
        refreshPayments(),
        refreshTaxes(),
        refreshExpenseCategories(),
      ]);
    } catch (error) {
      console.error('Error refreshing accounting data:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshExpenses, refreshPayments, refreshTaxes, refreshExpenseCategories]);

  const value = {
    // State
    expenses,
    payments,
    taxes,
    expenseCategories,
    paymentSummary,
    taxSummary,
    loading,
    
    // Actions
    refreshAll,
    refreshExpenses,
    refreshPayments,
    refreshTaxes,
    refreshExpenseCategories,
    
    // Direct setters (for optimistic updates)
    setExpenses,
    setPayments,
    setTaxes,
    setExpenseCategories,
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
};

// Custom hook to use the accounting context
export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};

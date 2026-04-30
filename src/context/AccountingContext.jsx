import { createContext, useContext, useState, useCallback } from 'react';
import {
  fetchExpenses, fetchPayments, fetchTaxes,
  fetchExpenseCategories, fetchPaymentSummary, fetchTaxSummary,
} from '../api/accounting';
import { getAll, bulkUpsert } from '../services/localStore';

const AccountingContext = createContext(null);

export const AccountingProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [taxSummary, setTaxSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshExpenses = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const data = await fetchExpenses();
        setExpenses(data);
        await bulkUpsert('accounting', [{ id: 'expenses_list', data, updated_at: new Date().toISOString() }]);
        return data;
      } else {
        const cached = await getAll('accounting');
        const entry = cached.find(r => r.id === 'expenses_list');
        if (entry) setExpenses(entry.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      const cached = await getAll('accounting').catch(() => []);
      const entry = cached.find(r => r.id === 'expenses_list');
      if (entry) setExpenses(entry.data);
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const [paymentsData, summaryData] = await Promise.all([fetchPayments(), fetchPaymentSummary()]);
        setPayments(paymentsData);
        setPaymentSummary(summaryData);
        await bulkUpsert('accounting', [
          { id: 'payments_list',    data: paymentsData, updated_at: new Date().toISOString() },
          { id: 'payments_summary', data: summaryData,  updated_at: new Date().toISOString() },
        ]);
        return paymentsData;
      } else {
        const cached = await getAll('accounting');
        const pEntry = cached.find(r => r.id === 'payments_list');
        const sEntry = cached.find(r => r.id === 'payments_summary');
        if (pEntry) setPayments(pEntry.data);
        if (sEntry) setPaymentSummary(sEntry.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      const cached = await getAll('accounting').catch(() => []);
      const pEntry = cached.find(r => r.id === 'payments_list');
      const sEntry = cached.find(r => r.id === 'payments_summary');
      if (pEntry) setPayments(pEntry.data);
      if (sEntry) setPaymentSummary(sEntry.data);
    }
  }, []);

  const refreshTaxes = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const [taxesData, summaryData] = await Promise.all([fetchTaxes(), fetchTaxSummary()]);
        setTaxes(taxesData);
        setTaxSummary(summaryData);
        await bulkUpsert('accounting', [
          { id: 'taxes_list',    data: taxesData,   updated_at: new Date().toISOString() },
          { id: 'taxes_summary', data: summaryData, updated_at: new Date().toISOString() },
        ]);
        return taxesData;
      } else {
        const cached = await getAll('accounting');
        const tEntry = cached.find(r => r.id === 'taxes_list');
        const sEntry = cached.find(r => r.id === 'taxes_summary');
        if (tEntry) setTaxes(tEntry.data);
        if (sEntry) setTaxSummary(sEntry.data);
      }
    } catch (error) {
      console.error('Error fetching taxes:', error);
    }
  }, []);

  const refreshExpenseCategories = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const data = await fetchExpenseCategories();
        setExpenseCategories(data);
        await bulkUpsert('accounting', [{ id: 'expense_categories', data, updated_at: new Date().toISOString() }]);
        return data;
      } else {
        const cached = await getAll('accounting');
        const entry = cached.find(r => r.id === 'expense_categories');
        if (entry) setExpenseCategories(entry.data);
      }
    } catch (error) {
      console.error('Error fetching expense categories:', error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshExpenses(), refreshPayments(), refreshTaxes(), refreshExpenseCategories()]);
    } catch (error) {
      console.error('Error refreshing accounting data:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshExpenses, refreshPayments, refreshTaxes, refreshExpenseCategories]);

  const value = {
    expenses, payments, taxes, expenseCategories, paymentSummary, taxSummary, loading,
    refreshAll, refreshExpenses, refreshPayments, refreshTaxes, refreshExpenseCategories,
    setExpenses, setPayments, setTaxes, setExpenseCategories,
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) throw new Error('useAccounting must be used within an AccountingProvider');
  return context;
};

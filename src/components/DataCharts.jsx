import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, getCurrencyCode } from '../utils/pricingHelpers';

export default function DataCharts({ data }) {
  const { pricingSettings } = useConfig();
  const currencyCode = getCurrencyCode(pricingSettings);
  const fmt = (value) => formatCurrency(value, pricingSettings);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: data.filter(item => item.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Confirmed', value: data.filter(item => item.status === 'Confirmed').length, color: '#3b82f6' },
    { name: 'Completed', value: data.filter(item => item.status === 'Completed').length, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Revenue by product for bar chart
  const revenueData = data.reduce((acc, item) => {
    const existing = acc.find(p => p.product === item.product);
    if (existing) {
      existing.revenue += item.total || 0;
      existing.quantity += item.quantity || 0;
    } else {
      acc.push({
        product: item.product || 'Unknown',
        revenue: item.total || 0,
        quantity: item.quantity || 0
      });
    }
    return acc;
  }, []).slice(0, 10); // Top 10 products

  // Daily orders for line chart
  const dailyData = data.reduce((acc, item) => {
    const date = item.date || new Date().toISOString().split('T')[0];
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.orders += 1;
      existing.revenue += item.total || 0;
    } else {
      acc.push({
        date,
        orders: 1,
        revenue: item.total || 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Analytics</h3>
        <p className="text-gray-500 text-center py-8">No data available for charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <div>
            <h4 className="text-md font-medium mb-3">Order Status Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Product Bar Chart */}
          <div>
            <h4 className="text-md font-medium mb-3">Revenue by Product</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="product" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value) => [fmt(value), `Revenue (${currencyCode})`]} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Orders Line Chart */}
        {dailyData.length > 1 && (
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">Daily Orders Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value, name) => [
                      name === 'revenue' ? fmt(value) : value,
                      name === 'revenue' ? `Revenue (${currencyCode})` : 'Orders'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" fill="#10b981" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-semibold">{fmt(data.reduce((sum, item) => sum + (item.total || 0), 0))}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-lg font-semibold">{fmt(data.length > 0 ? data.reduce((sum, item) => sum + (item.total || 0), 0) / data.length : 0)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-lg font-semibold">
              {data.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-lg font-semibold">
              {data.length > 0 ? Math.round((data.filter(item => item.status === 'Completed').length / data.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
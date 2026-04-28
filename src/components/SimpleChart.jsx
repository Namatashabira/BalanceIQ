import React from 'react';

const SimpleChart = ({ data, type = 'bar', title }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {type === 'bar' && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">
                    {new Intl.NumberFormat().format(item.value)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {type === 'pie' && (
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                const total = data.reduce((sum, d) => sum + d.value, 0);
                if (total === 0) return null;
                
                let cumulativePercentage = 0;
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                
                return data.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = -cumulativePercentage;
                  cumulativePercentage += percentage;
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="15.915"
                      fill="transparent"
                      stroke={colors[index % colors.length]}
                      strokeWidth="31.83"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.reduce((sum, d) => sum + d.value, 0)}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
          <div className="ml-4 space-y-2">
            {data.map((item, index) => {
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
              return (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm">{item.label}: {item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleChart;
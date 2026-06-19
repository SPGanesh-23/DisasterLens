import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ClimateCharts({ climateData }) {
  if (!climateData || !climateData.yearlyData) return null;

  const data = climateData.yearlyData;

  const tooltipStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f1f5f9'
  };

  return (
    <div className="climate-charts-section mt-8">
      <h3 className="section-title">10-Year Climate Trends</h3>
      
      <div className="charts-grid">
        <div className="chart-card card">
          <h4 className="chart-title">Average Maximum Temperature (°C)</h4>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgTemp" 
                  name="Avg Max Temp" 
                  stroke="#ef4444" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#ef4444', r: 3 }}
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#020817', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card card">
          <h4 className="chart-title">Annual Rainfall (mm) vs Dry Days</h4>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalRain" name="Rainfall (mm)" fill="rgba(59,130,246,0.8)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="dryDays" name="Dry Days" fill="rgba(245,158,11,0.8)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClimateCharts;

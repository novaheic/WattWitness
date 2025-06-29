import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useInstallation, useTotalProduction, useLifetimeProduction, useChartData } from '../hooks/usePowerData';

// Remove static data - we'll use real data from API
// const data = [
//   { day: 'T', value: 250 },
//   { day: 'W', value: 200 },
//   { day: 'T', value: 280 },
//   { day: 'F', value: 300 },
//   { day: 'S', value: 143.5 },
//   { day: 'S', value: 120 },
//   { day: 'M', value: 180 },
// ];

type TimeFrame = {
  id: number;
  name: string;
};

const timeFrames: TimeFrame[] = [
  { id: 1, name: 'Hour' },
  { id: 2, name: 'Day' },
  { id: 3, name: 'Week' },
  { id: 4, name: 'Month' },
  { id: 5, name: 'Year' },
];

const CustomTooltip = ({ active, payload, coordinate, viewBox }: any) => {
  if (active && payload && payload.length && viewBox) {
    const value = payload[0].value;
    
    // Get the maximum value from the entire chart data for proper scaling
    const chartData = payload[0].payload && payload[0].payload.chartData ? payload[0].payload.chartData : [];
    const chartMax = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.value)) : value;
    
    // Calculate the exact Y position based on the chart's viewBox
    const { height } = viewBox;
    const barTopPosition = height - (value / (chartMax || 1) * height);

    // Format the value with appropriate units
    let formattedValue: string;
    if (value >= 1000000) {
      formattedValue = `${(value / 1000000).toFixed(2)} MWh`;
    } else if (value >= 1000) {
      formattedValue = `${(value / 1000).toFixed(2)} kWh`;
    } else {
      formattedValue = `${value.toFixed(2)} Wh`;
    }

    return (
      <div
        style={{
          transform: 'translate(-50%, -100%)',
          left: coordinate.x,
          top: barTopPosition,
          position: 'absolute',
          pointerEvents: 'none'
        }}
      >
        <div className="relative">
          <div className="bg-[#1A1A1A]/90 text-white px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1">
            <span className="font-medium">{formattedValue}</span>
          </div>
          {/* Triangle pointer */}
          <div 
            className="absolute left-1/2 bottom-[-6px] transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(26, 26, 26, 0.9)'
            }}
          />
        </div>
      </div>
    );
  }
  return null;
};

export const EnergyChart: React.FC = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(timeFrames[2]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add ref for the chart container
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  // Get installation and production data
  const { data: installation } = useInstallation();
  const { data: totalProduction, isLoading: totalProductionLoading, error: totalProductionError } = useTotalProduction(
    installation?.id, 
    selectedTimeFrame.name
  );
  const { data: lifetimeProduction, isLoading: lifetimeLoading, error: lifetimeError } = useLifetimeProduction(
    installation?.id
  );
  
  // Get chart data
  const { data: chartData, isLoading: chartLoading, error: chartError } = useChartData(
    installation?.id,
    selectedTimeFrame.name
  );

  // Debug: Log the raw chart data we receive from backend
  useEffect(() => {
    if (chartData && selectedTimeFrame.name.toLowerCase() === 'week') {
      console.log('🔍 RAW BACKEND WEEK DATA:', chartData);
      console.log('📊 Raw data points:', chartData.data_points?.map(p => ({
        label: p.label,
        timestamp: p.timestamp,
        localTime: new Date(p.timestamp * 1000).toLocaleString(),
        localDate: new Date(p.timestamp * 1000).toLocaleDateString('en-CA'),
        localDay: new Date(p.timestamp * 1000).toLocaleDateString([], { weekday: 'short' }),
        value: p.value
      })));
    }
  }, [chartData, selectedTimeFrame.name]);

  // Transform and regroup chart data for local timezone (week/month only)
  const regroupByLocalTime = (dataPoints: any[], timeFrame: string) => {
    // For hour/day/year, backend grouping works fine - just update labels
    if (!['week', 'month'].includes(timeFrame.toLowerCase())) {
      return dataPoints.map(point => {
        const date = new Date(point.timestamp * 1000);
        let localLabel = '';
        switch (timeFrame.toLowerCase()) {
          case 'hour':
            localLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            break;
          case 'day':
            localLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            break;
          case 'year':
            localLabel = date.toLocaleDateString([], { month: 'short' });
            break;
          default:
            localLabel = point.label;
        }
        return {
          day: localLabel,
          value: point.value,
          rawLabel: point.label,
          timestamp: point.timestamp,
          chartData: dataPoints
        };
      });
    }

    // For week/month, regroup by LOCAL timezone to fix UTC day grouping issue
    console.log(`🌍 Regrouping ${timeFrame} data by local timezone (fixing UTC day grouping)`);
    const groupedByLocalTime = new Map<string, { 
      value: number, 
      timestamp: number, 
      localLabel: string,
      count: number 
    }>();
    
    dataPoints.forEach(point => {
      const date = new Date(point.timestamp * 1000);
      let groupKey = '';
      let localLabel = '';
      
      if (timeFrame.toLowerCase() === 'week') {
        // Group by local date (YYYY-MM-DD format for consistent grouping)
        groupKey = date.toLocaleDateString('en-CA'); // ISO format: YYYY-MM-DD
        localLabel = date.toLocaleDateString([], { weekday: 'short' }); // Mon, Tue, etc.
      } else if (timeFrame.toLowerCase() === 'month') {
        // Group by local date for month view
        groupKey = date.toLocaleDateString('en-CA'); // ISO format: YYYY-MM-DD 
        localLabel = date.toLocaleDateString([], { month: 'short', day: '2-digit' }); // Jan 15, etc.
      }
      
      if (groupedByLocalTime.has(groupKey)) {
        // Combine energy from multiple UTC buckets that fall on same local day
        const existing = groupedByLocalTime.get(groupKey)!;
        existing.value += point.value;
        existing.count += 1;
        console.log(`📅 Combined ${timeFrame} data: ${groupKey} (${localLabel}) now has ${existing.value.toFixed(2)}Wh from ${existing.count} UTC buckets`);
      } else {
        // Create new local day group
        groupedByLocalTime.set(groupKey, {
          value: point.value,
          timestamp: point.timestamp,
          localLabel: localLabel,
          count: 1
        });
        console.log(`📅 New ${timeFrame} group: ${groupKey} (${localLabel}) = ${point.value.toFixed(2)}Wh`);
      }
    });
    
    // Convert back to array, sort by timestamp, and format for chart
    const regroupedData = Array.from(groupedByLocalTime.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(group => ({
        day: group.localLabel,
        value: group.value,
        rawLabel: group.localLabel,
        timestamp: group.timestamp,
        chartData: dataPoints // Include original data for tooltip scaling
      }));
    
    console.log(`🔄 Regrouped ${dataPoints.length} UTC ${timeFrame} buckets → ${regroupedData.length} local ${timeFrame} buckets`);
    return regroupedData;
  };

  // Apply the regrouping logic
  const chartDataForRecharts = regroupByLocalTime(
    chartData?.data_points || [], 
    selectedTimeFrame.name
  );

  // Debug: Log the final chart data
  useEffect(() => {
    if (chartDataForRecharts.length > 0 && selectedTimeFrame.name.toLowerCase() === 'week') {
      console.log('📈 FINAL CHART DATA FOR WEEK:', chartDataForRecharts);
      console.log('📅 Final chart labels:', chartDataForRecharts.map(d => d.day));
    }
  }, [chartDataForRecharts, selectedTimeFrame.name]);

  // Update chart width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        setChartWidth(chartRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleTimeFrameSelect = (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format production values with appropriate units
  const formatProduction = (value: number | undefined, isLoading: boolean, error: any) => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error';
    if (value === undefined || value === null) return '0.00 Wh';
    
    // Format with appropriate units based on value size
    if (value >= 1000000) {
      const result = `${(value / 1000000).toFixed(2)} MWh`;
      return result;
    } else if (value >= 1000) {
      const result = `${(value / 1000).toFixed(2)} kWh`;
      return result;
    } else {
      const result = `${value.toFixed(2)} Wh`;
      return result;
    }
  };

  const formatLifetimeProduction = (value: number | undefined, isLoading: boolean, error: any) => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error';
    if (value === undefined || value === null) return '0.00 Wh';
    
    // Format large numbers with appropriate units
    if (value >= 1000000) {
      const result = `${(value / 1000000).toFixed(2)} MWh`;
      return result;
    } else if (value >= 1000) {
      const result = `${(value / 1000).toFixed(2)} kWh`;
      return result;
    } else {
      const result = `${value.toFixed(2)} Wh`;
      return result;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Energy Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">
            Trust-minimized Electricity Meter using Chainlink
          </p>
        </div>
        
        {/* Custom Time Frame Selector */}
        <div className="relative w-28" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full py-2 px-3 text-left bg-white border-2 border-gray-300 hover:border-gray-600 focus:border-gray-600 rounded-[41px] cursor-pointer focus:outline-none flex items-center justify-between text-gray-600 hover:text-gray-600"
          >
            <span className="text-gray-600">{selectedTimeFrame.name}</span>
            <svg 
              className={`h-5 w-5 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="none" 
              stroke="currentColor"
            >
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
              {timeFrames.map((timeFrame, index) => (
                <div
                  key={timeFrame.id}
                  onClick={() => handleTimeFrameSelect(timeFrame)}
                  className={`dropdown-option w-full px-3 py-2 text-left cursor-pointer ${
                    selectedTimeFrame.id === timeFrame.id 
                      ? 'bg-gray-100 text-black font-medium' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } ${
                    index === 0 ? 'rounded-t-lg' : ''
                  } ${
                    index === timeFrames.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                >
                  {timeFrame.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-1">
        {/* Stats Section - Left Side */}
        <div className="flex flex-col justify-end pr-8 mb-8">
          <div className="mb-4">
            <h3 className="text-3xl font-bold text-gray-900">
              {formatProduction(totalProduction, totalProductionLoading, totalProductionError)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Produced this {selectedTimeFrame.name.toLowerCase()}</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">
              {formatLifetimeProduction(lifetimeProduction, lifetimeLoading, lifetimeError)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Lifetime Production</p>
          </div>
        </div>

        {/* Chart Section - Right Side */}
        <div className="flex-1 pt-4" ref={chartRef}>
          {chartLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <div className="text-gray-500 text-sm">Loading chart data...</div>
            </div>
          ) : chartError ? (
            <div className="flex items-center justify-center h-[280px]">
              <div className="text-red-500 text-sm">Error loading chart data</div>
            </div>
          ) : chartDataForRecharts.length === 0 ? (
            <div className="flex items-center justify-center h-[280px]">
              <div className="text-gray-500 text-sm">No data available for this time frame</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={chartDataForRecharts} 
                margin={{ top: 20, right: 10, left: 40, bottom: 20 }}
                barSize={40}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF61B8" />
                    <stop offset="100%" stopColor="#FFA630" />
                  </linearGradient>
                  <pattern id="gradient" patternUnits="userSpaceOnUse" width={chartWidth} height="100%">
                    <rect width={chartWidth} height="100%" fill="url(#barGradient)" />
                  </pattern>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  hide={true}
                  domain={[0, 'dataMax']}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={false}
                  allowEscapeViewBox={{ x: false, y: true }}
                  position={{ x: 0, y: 0 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#gradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}; 
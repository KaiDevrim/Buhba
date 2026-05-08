import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import Drink from '../database/model/Drink';

const CHART_HEIGHT = 140;
const PIE_CHART_SIZE = 140;

// Color palette for pie chart flavors
const FLAVOR_COLORS = [
  '#F5A623',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B195',
];

interface StatsBarChartProps {
  drinks: Drink[];
}

interface FlavorData {
  flavor: string;
  count: number;
  percentage: number;
  color: string;
}

interface PieSegment {
  startAngle: number;
  endAngle: number;
  color: string;
  flavor: string;
  percentage: number;
}

type TabType = 'Spending' | 'Flavors';

const calculateFlavorDistribution = (drinks: Drink[]): FlavorData[] => {
  const flavorMap = new Map<string, number>();

  drinks.forEach((drink) => {
    if (drink.flavor && drink.flavor.trim()) {
      flavorMap.set(drink.flavor, (flavorMap.get(drink.flavor) || 0) + 1);
    }
  });

  if (flavorMap.size === 0) return [];

  const total = drinks.length;
  return Array.from(flavorMap.entries())
    .map(([flavor, count], index) => ({
      flavor,
      count,
      percentage: (count / total) * 100,
      color: FLAVOR_COLORS[index % FLAVOR_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);
};

interface PieChartProps {
  data: FlavorData[];
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const size = PIE_CHART_SIZE;
  const radiusOuter = size / 2 - 10;
  const radiusInner = radiusOuter * 0.6; // Create donut effect
  const segments: PieSegment[] = [];

  let currentAngle = -90; // Start from top

  data.forEach((flavor) => {
    const sliceAngle = (flavor.percentage / 100) * 360;
    const endAngle = currentAngle + sliceAngle;

    segments.push({
      startAngle: currentAngle,
      endAngle,
      color: flavor.color,
      flavor: flavor.flavor,
      percentage: flavor.percentage,
    });

    currentAngle = endAngle;
  });

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createArcPath = (
    centerX: number,
    centerY: number,
    radiusOuter: number,
    radiusInner: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(centerX, centerY, radiusOuter, endAngle);
    const end = polarToCartesian(centerX, centerY, radiusOuter, startAngle);
    const startInner = polarToCartesian(centerX, centerY, radiusInner, endAngle);
    const endInner = polarToCartesian(centerX, centerY, radiusInner, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radiusOuter} ${radiusOuter} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${endInner.x} ${endInner.y} A ${radiusInner} ${radiusInner} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y} Z`;
  };

  // Calculate label positions
  const getSegmentLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = (radiusOuter + radiusInner) / 2;
    return polarToCartesian(size / 2, size / 2, labelRadius, midAngle);
  };

  return (
    <View style={styles.pieChartContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <Path
            key={index}
            d={createArcPath(
              size / 2,
              size / 2,
              radiusOuter,
              radiusInner,
              segment.startAngle,
              segment.endAngle
            )}
            fill={segment.color}
          />
        ))}
        {/* Percentage labels on segments */}
        {segments.map((segment, index) => {
          const labelPos = getSegmentLabelPosition(segment.startAngle, segment.endAngle);
          return (
            <SvgText
              key={`label-${index}`}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#fff">
              {segment.percentage.toFixed(0)}%
            </SvgText>
          );
        })}
      </Svg>
      <View style={styles.pieLegend}>
        {data.map((flavor, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: flavor.color }]} />
            <Text style={styles.legendLabel}>{flavor.flavor}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const StatsBarChart: React.FC<StatsBarChartProps> = ({ drinks }) => {
  const [activeTab, setActiveTab] = useState<TabType>('Spending');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = previous, etc.

  // Group data by day for the selected month
  const chartData = useMemo(() => {
    if (!drinks || drinks.length === 0) return { days: [], maxVal: 0, monthLabel: '' };

    // Find the latest date and calculate target month based on offset
    let latestDate = new Date(0);
    drinks.forEach((d) => {
      if (d.date) {
        const dDate = new Date(d.date);
        if (dDate > latestDate) latestDate = dDate;
      }
    });

    // Calculate the target month based on offset
    const targetDate = new Date(latestDate);
    targetDate.setMonth(targetDate.getMonth() + monthOffset);

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Init array of days
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      totalSpend: 0,
      flavors: 0,
      flavorSet: new Set<string>(),
      dateStr: new Date(targetYear, targetMonth, i + 1).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    drinks.forEach((d) => {
      if (d.date) {
        const dDate = new Date(d.date);
        if (dDate.getFullYear() === targetYear && dDate.getMonth() === targetMonth) {
          const dayIdx = dDate.getDate() - 1;
          if (dayIdx >= 0 && dayIdx < daysInMonth) {
            dailyData[dayIdx].totalSpend += d.price || 0;
            if (d.flavor) {
              dailyData[dayIdx].flavorSet.add(d.flavor);
            }
          }
        }
      }
    });

    dailyData.forEach((d) => {
      d.flavors = d.flavorSet.size;
    });

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const monthLabel = `${monthName} 01 - ${daysInMonth}, ${targetYear}`;

    let maxVal = 1;
    dailyData.forEach((d) => {
      const val = activeTab === 'Spending' ? d.totalSpend : d.flavors;
      if (val > maxVal) maxVal = val;
    });

    return { days: dailyData, maxVal, monthLabel };
  }, [drinks, activeTab, monthOffset]);

  const { days, maxVal, monthLabel } = chartData;

  const yLines =
    activeTab === 'Spending'
      ? [Math.max(10, Math.ceil(maxVal)), Math.max(5, Math.ceil(maxVal / 2)), 0]
      : [Math.ceil(maxVal), Math.ceil(maxVal / 2), 0];

  const flavorData = useMemo(() => calculateFlavorDistribution(drinks), [drinks]);
  const isEmptyFlavors = activeTab === 'Flavors' && flavorData.length === 0;

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.headerWithNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            setMonthOffset((prev) => prev - 1);
            setSelectedIndex(null);
          }}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.dateLabel}>{monthLabel}</Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'Spending' && styles.toggleActive]}
              onPress={() => {
                setActiveTab('Spending');
                setSelectedIndex(null);
              }}>
              <Text
                style={[styles.toggleText, activeTab === 'Spending' && styles.toggleTextActive]}>
                Spending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'Flavors' && styles.toggleActive]}
              onPress={() => {
                setActiveTab('Flavors');
                setSelectedIndex(null);
              }}>
              <Text style={[styles.toggleText, activeTab === 'Flavors' && styles.toggleTextActive]}>
                Flavors
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            setMonthOffset((prev) => prev + 1);
            setSelectedIndex(null);
          }}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Chart Area */}
      {activeTab === 'Spending' ? (
        <View style={styles.chartBody}>
          {/* Y Axis Grid */}
          <View style={styles.gridLayer}>
            <View style={styles.gridLineContainer}>
              <View style={styles.gridLine} />
              <Text style={styles.yAxisText}>
                {activeTab === 'Spending' ? `$${yLines[0]}` : yLines[0]}
              </Text>
            </View>
            <View style={styles.gridLineContainer}>
              <View style={styles.gridLine} />
              <Text style={styles.yAxisText}>
                {activeTab === 'Spending' ? `$${yLines[1]}` : yLines[1]}
              </Text>
            </View>
            <View style={styles.gridLineContainer}>
              <View style={styles.gridLine} />
              <Text style={styles.yAxisText}></Text>
            </View>
          </View>

          {/* Bars Layer */}
          <View style={styles.barsLayer}>
            {days.map((item, index) => {
              const val = activeTab === 'Spending' ? item.totalSpend : item.flavors;
              const chartMax = yLines[0];
              const heightPercent = val > 0 ? Math.max((val / chartMax) * 100, 5) : 0;

              if (heightPercent === 0) {
                return <View key={index} style={styles.emptyBarSlot} />;
              }

              const isSelected = selectedIndex === index;

              return (
                <TouchableWithoutFeedback key={index} onPress={() => setSelectedIndex(index)}>
                  <View style={styles.barColumn}>
                    {isSelected && (
                      <View style={styles.tooltipContainer}>
                        <View style={styles.tooltipBox}>
                          <Text style={styles.tooltipVal}>
                            {activeTab === 'Spending' ? `$${val.toFixed(2)}` : val}
                          </Text>
                          <Text style={styles.tooltipDate}>{item.dateStr}</Text>
                        </View>
                        <View style={styles.tooltipLine} />
                      </View>
                    )}
                    <LinearGradient
                      colors={isSelected ? ['#E69500', '#FDE0B2'] : ['#F5A623', '#FEF0D4']}
                      style={[styles.bar, { height: `${heightPercent}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  </View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>

          {/* X Axis */}
          <View style={styles.xAxisRow}>
            <Text style={styles.xLabel}>01</Text>
            <Text style={styles.xLabel}>{days.length}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.flavorChartContainer}>
          {isEmptyFlavors ? (
            <Text style={styles.emptyText}>No flavor data available</Text>
          ) : (
            <PieChart data={flavorData} />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 5,
    width: '100%',
  },
  headerWithNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  navBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
  navBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8D6E63',
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D4037',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5D4037',
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#F5A623',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D6E63',
  },
  toggleTextActive: {
    color: '#fff',
  },
  chartBody: {
    height: CHART_HEIGHT,
    position: 'relative',
    paddingBottom: 16,
  },
  gridLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 16,
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  gridLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  yAxisText: {
    width: 28,
    textAlign: 'right',
    fontSize: 9,
    color: '#9E9E9E',
    marginLeft: 3,
  },
  barsLayer: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 31,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  emptyBarSlot: {
    flex: 1,
    marginHorizontal: 1,
  },
  barColumn: {
    flex: 1,
    marginHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    maxWidth: 12,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipBox: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    minWidth: 70,
    marginBottom: -3,
  },
  tooltipVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  tooltipDate: {
    fontSize: 9,
    color: '#8D6E63',
  },
  tooltipLine: {
    width: 1,
    height: 25,
    backgroundColor: '#BDBDBD',
  },
  xAxisRow: {
    position: 'absolute',
    left: 0,
    right: 31,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabel: {
    fontSize: 9,
    color: '#9E9E9E',
  },
  pieChartContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pieLegend: {
    marginTop: 12,
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#5D4037',
    fontWeight: '500',
  },
  flavorChartContainer: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});

import { View, Text } from '@tarojs/components'

interface Range {
  min?: number
  max?: number
  label: string
}

interface HealthRangeBarProps {
  currentValue: number
  ranges: {
    low?: Range
    underweight?: Range
    normal: Range
    high?: Range
    overweight?: Range
    obese: Range
    preObese?: Range
  }
  unit?: string
  minValue?: number
  maxValue?: number
}

export function HealthRangeBar({
  currentValue,
  ranges,
  unit = '',
  minValue,
  maxValue
}: HealthRangeBarProps) {
  // 确定线段图的最小值和最大值
  const allRanges = Object.values(ranges).filter(Boolean) as Range[]
  let minVal = minValue ?? Math.min(...allRanges.map(r => r.min ?? 0))
  let maxVal = maxValue ?? Math.max(...allRanges.map(r => r.max ?? 100))
  
  // 确保当前值在显示范围内
  minVal = Math.min(minVal, currentValue - 2)
  maxVal = Math.max(maxVal, currentValue + 2)
  
  const totalRange = maxVal - minVal
  
  // 计算当前值的位置（百分比）
  const currentPosition = ((currentValue - minVal) / totalRange) * 100
  
  // 定义颜色映射
  const colorMap: Record<string, { bg: string; text: string }> = {
    '偏低': { bg: 'bg-blue-400', text: 'text-blue-500' },
    '体重过低': { bg: 'bg-blue-400', text: 'text-blue-500' },
    '正常': { bg: 'bg-green-400', text: 'text-green-500' },
    '偏高': { bg: 'bg-yellow-400', text: 'text-yellow-600' },
    '超重': { bg: 'bg-yellow-400', text: 'text-yellow-600' },
    '中心型肥胖前期': { bg: 'bg-yellow-400', text: 'text-yellow-600' },
    '肥胖': { bg: 'bg-red-400', text: 'text-red-500' },
    '中心型肥胖': { bg: 'bg-red-400', text: 'text-red-500' }
  }
  
  // 计算每个区间的宽度和位置
  function getRangeStyle(range: Range) {
    const start = range.min ?? minVal
    const end = range.max ?? maxVal
    const width = ((end - start) / totalRange) * 100
    const left = ((start - minVal) / totalRange) * 100
    return { width: `${width}%`, left: `${left}%` }
  }
  
  // 渲染区间
  function renderRanges() {
    const elements: JSX.Element[] = []
    
    // 处理所有区间类型
    const rangeKeys = ['underweight', 'low', 'normal', 'high', 'overweight', 'preObese', 'obese'] as const
    
    rangeKeys.forEach((key) => {
      const range = ranges[key]
      if (range) {
        const colors = colorMap[range.label] || { bg: 'bg-gray-400', text: 'text-gray-500' }
        elements.push(
          <View
            key={key}
            className={`absolute h-full rounded-sm ${colors.bg}`}
            style={getRangeStyle(range)}
          />
        )
      }
    })
    
    return elements
  }
  
  return (
    <View className="mt-4">
      {/* 线段图 */}
      <View className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '32px', marginTop: '28px' }}>
        {/* 区间色块 */}
        {renderRanges()}
        
        {/* 当前值标记 - 钟表式指针（箭头向上） */}
        <View
          className="absolute flex flex-col items-center z-10"
          style={{
            left: `${Math.min(Math.max(currentPosition, 2), 98)}%`,
            bottom: '100%',
            transform: 'translateX(-50%)'
          }}
        >
          {/* 箭头向上 */}
          <View
            className="w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '6px solid #1f2937'
            }}
          />
          {/* 数值标签 */}
          <View className="px-2 py-1 bg-gray-800 rounded">
            <Text className="text-xs text-white font-medium">
              {currentValue.toFixed(1)}{unit}
            </Text>
          </View>
        </View>
      </View>
      
      {/* 刻度值 - 紧挨线段 */}
      <View className="relative h-4 mt-1">
        {(() => {
          const ticks: JSX.Element[] = []
          const tickCount = 5
          for (let i = 0; i <= tickCount; i++) {
            const value = minVal + (totalRange / tickCount) * i
            const position = (i / tickCount) * 100
            ticks.push(
              <View
                key={`tick-${i}`}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <Text className="text-xs text-gray-400">
                  {value.toFixed(0)}
                </Text>
              </View>
            )
          }
          return ticks
        })()}
      </View>
      
      {/* 区间标签 - 一行显示，避免重叠 */}
      <View className="relative h-6 mt-2">
        {(() => {
          const labels: JSX.Element[] = []
          const rangeKeys = ['underweight', 'low', 'normal', 'high', 'overweight', 'preObese', 'obese'] as const
          
          rangeKeys.forEach((key) => {
            const range = ranges[key]
            if (range) {
              const colors = colorMap[range.label] || { bg: 'bg-gray-400', text: 'text-gray-500' }
              const start = range.min ?? minVal
              const end = range.max ?? maxVal
              let midPoint = ((start + end) / 2 - minVal) / totalRange * 100
              
              // 针对特定标签调整位置，避免重叠
              if (range.label === '中心型肥胖') {
                midPoint = Math.min(midPoint + 8, 95)  // 向右移动
              } else if (range.label === '中心型肥胖前期') {
                midPoint = Math.max(midPoint - 3, 15)  // 稍微向左
              }
              
              labels.push(
                <View
                  key={`label-${key}`}
                  className="absolute transform -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${midPoint}%` }}
                >
                  <Text className={`text-xs ${colors.text} font-medium`}>
                    {range.label}
                  </Text>
                </View>
              )
            }
          })
          
          return labels
        })()}
      </View>
    </View>
  )
}

import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Calendar, Scale, History, ChevronLeft, ChevronRight, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'

interface Record {
  id: string
  record_date: string
  weight: number
  waist: number
  note?: string
}

export default function CheckinPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [note, setNote] = useState('')
  const [recentRecords, setRecentRecords] = useState<Record[]>([])
  const [todayCheckedIn, setTodayCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 日历状态
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set())

  function getTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function onDateChange(e) {
    const newDate = e.detail.value
    setSelectedDate(newDate)
    // 检查选择的日期是否已有记录
    checkExistingRecord(newDate)
  }

  async function checkExistingRecord(date: string) {
    try {
      const res = await Network.request({
        url: '/api/records/date/' + date,
        method: 'GET'
      })
      console.log('Check existing record:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        // 已有记录，填充数据
        const record = res.data.data
        setWeight(record.weight?.toString() || '')
        setWaist(record.waist?.toString() || '')
        setNote(record.note || '')
      } else {
        // 无记录，清空表单
        setWeight('')
        setWaist('')
        setNote('')
      }
    } catch (error) {
      console.error('Check existing record error:', error)
      // 出错也清空表单
      setWeight('')
      setWaist('')
      setNote('')
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === getTodayDate()) {
      return '今天'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天'
    } else {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekdays[date.getDay()]
    }
  }

  async function fetchRecentRecords() {
    try {
      const res = await Network.request({
        url: '/api/records/recent',
        method: 'GET',
        data: { days: 7 }
      })
      console.log('Recent records response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setRecentRecords(res.data.data)
        // 检查今天是否已打卡
        const todayRecord = res.data.data.find((r: Record) => r.record_date === getTodayDate())
        setTodayCheckedIn(!!todayRecord)
      }
    } catch (error) {
      console.error('Fetch recent records error:', error)
    }
  }

  // 获取指定月份的打卡记录
  async function fetchMonthRecords(year: number, month: number) {
    try {
      // 计算月份的开始和结束日期
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      
      const res = await Network.request({
        url: '/api/records/history',
        method: 'GET',
        data: { startDate, endDate }
      })
      console.log('Month records response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const dates = new Set<string>(res.data.data.map((r: Record) => r.record_date))
        setCheckedDates(dates)
      } else {
        setCheckedDates(new Set<string>())
      }
    } catch (error) {
      console.error('Fetch month records error:', error)
      setCheckedDates(new Set<string>())
    }
  }

  // 切换月份
  function goToPrevMonth() {
    let newYear = currentYear
    let newMonth = currentMonth - 1
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    fetchMonthRecords(newYear, newMonth)
  }

  function goToNextMonth() {
    let newYear = currentYear
    let newMonth = currentMonth + 1
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setCurrentYear(newYear)
    setCurrentMonth(newMonth)
    fetchMonthRecords(newYear, newMonth)
  }

  // 生成日历网格
  function generateCalendarDays() {
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = []
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay() // 0-6, 0是周日
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    
    // 上个月的天数
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()
    
    // 填充上个月的日期
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const prevMonth = currentMonth - 1 === 0 ? 12 : currentMonth - 1
      const year = currentMonth - 1 === 0 ? currentYear - 1 : currentYear
      days.push({
        date: `${year}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        isCurrentMonth: false
      })
    }
    
    // 填充当月日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        day: i,
        isCurrentMonth: true
      })
    }
    
    // 填充下个月的日期（补齐6行）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = currentMonth + 1 === 13 ? 1 : currentMonth + 1
      const year = currentMonth + 1 === 13 ? currentYear + 1 : currentYear
      days.push({
        date: `${year}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        day: i,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  async function handleSubmit() {
    if (!weight) {
      Taro.showToast({ title: '请输入体重', icon: 'none' })
      return
    }
    if (!waist) {
      Taro.showToast({ title: '请输入腰围', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/records/checkin',
        method: 'POST',
        data: {
          date: selectedDate,
          weight: parseFloat(weight),
          waist: parseFloat(waist),
          note: note
        }
      })
      console.log('Checkin response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '打卡成功', icon: 'success' })
        setTodayCheckedIn(true)
        setWeight('')
        setWaist('')
        setNote('')
        fetchRecentRecords()
        fetchMonthRecords(currentYear, currentMonth)
        // 发送事件通知其他页面刷新数据
        Taro.eventCenter.trigger('checkinSuccess')
      } else {
        Taro.showToast({ title: res.data?.msg || '打卡失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Checkin error:', error)
      Taro.showToast({ title: '打卡失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentRecords()
    fetchMonthRecords(currentYear, currentMonth)
  }, [])

  // 每次进入页面时刷新数据
  useDidShow(() => {
    fetchRecentRecords()
    fetchMonthRecords(currentYear, currentMonth)
  })

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">记录数据</Text>
        <View 
          className="w-10 h-10 flex items-center justify-center rounded-full"
          onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
        >
          <History size={20} color="#6B7280" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {/* 打卡日历 */}
        <Card className="bg-white shadow-md mb-6">
          <CardContent className="p-4">
            {/* 日历头部 */}
            <View className="flex items-center justify-between mb-4">
              <View 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0EDE6]"
                onClick={goToPrevMonth}
              >
                <ChevronLeft size={20} color="#1E2933" />
              </View>
              <Text className="text-base font-semibold text-[#1E2933]">
                {currentYear}年{currentMonth}月
              </Text>
              <View 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0EDE6]"
                onClick={goToNextMonth}
              >
                <ChevronRight size={20} color="#1E2933" />
              </View>
            </View>
            
            {/* 星期标题 */}
            <View className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <View key={index} className="h-8 flex items-center justify-center">
                  <Text className={`text-xs font-medium ${index === 0 || index === 6 ? 'text-[#F26B3A]' : 'text-[#6B7280]'}`}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* 日历网格 */}
            <View className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((dayInfo, index) => {
                const isChecked = checkedDates.has(dayInfo.date)
                const isToday = dayInfo.date === getTodayDate()
                const canSelect = dayInfo.isCurrentMonth && new Date(dayInfo.date) <= new Date()
                
                return (
                  <View 
                    key={index}
                    className={`h-10 flex flex-col items-center justify-center rounded-lg relative ${
                      dayInfo.isCurrentMonth ? 'bg-[#F7F4ED]' : ''
                    } ${isToday ? 'ring-2 ring-[#F26B3A]' : ''}`}
                    onClick={() => {
                      if (canSelect) {
                        setSelectedDate(dayInfo.date)
                        checkExistingRecord(dayInfo.date)
                      }
                    }}
                  >
                    <Text className={`text-sm ${
                      !dayInfo.isCurrentMonth ? 'text-[#C4C4C4]' :
                      isToday ? 'text-[#F26B3A] font-semibold' :
                      'text-[#1E2933]'
                    }`}
                    >
                      {dayInfo.day}
                    </Text>
                    {isChecked && (
                      <View className="absolute -bottom-1 flex items-center justify-center">
                        <Check size={12} color="#3C8D6E" />
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
            
            {/* 图例说明 */}
            <View className="flex items-center justify-center gap-4 mt-4">
              <View className="flex items-center gap-1">
                <View className="w-3 h-3 rounded bg-[#3C8D6E]" />
                <Text className="text-xs text-[#6B7280]">已打卡</Text>
              </View>
              <View className="flex items-center gap-1">
                <View className="w-3 h-3 rounded ring-1 ring-[#F26B3A]" />
                <Text className="text-xs text-[#6B7280]">今天</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 今日打卡状态提示 */}
        <View 
          className={`rounded-xl p-3 flex items-center gap-3 mb-6 ${
            todayCheckedIn ? 'bg-[#3C8D6E]/10' : 'bg-[#F59E0B]/10'
          }`}
        >
          <View 
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              todayCheckedIn ? 'bg-[#3C8D6E]/20' : 'bg-[#F59E0B]/20'
            }`}
          >
            <Scale size={20} color={todayCheckedIn ? '#3C8D6E' : '#F59E0B'} />
          </View>
          <View className="flex-1">
            <Text 
              className={`text-sm font-medium ${
                todayCheckedIn ? 'text-[#3C8D6E]' : 'text-[#F59E0B]'
              }`}
            >
              {todayCheckedIn ? '今日已打卡' : '今日未打卡'}
            </Text>
            <Text className="text-xs text-[#6B7280] mt-1">
              {todayCheckedIn ? '坚持就是胜利，继续保持！' : '快来记录今天的数据吧'}
            </Text>
          </View>
        </View>

        {/* 打卡表单卡片 */}
        <Card className="bg-white shadow-md mb-6">
          <CardContent className="p-4">
            <View className="space-y-5">
              {/* 日期选择 */}
              <View>
                <Text className="text-sm font-medium text-[#1E2933] mb-2 block">打卡日期</Text>
                <Picker mode="date" value={selectedDate} onChange={onDateChange} end={getTodayDate()}>
                  <View className="bg-[#F0EDE6] rounded-xl px-4 py-3 flex items-center justify-between">
                    <Text className="text-base text-[#1E2933]">{selectedDate}</Text>
                    <View className="flex items-center gap-2">
                      <Text className="text-xs text-[#F26B3A]">点击选择</Text>
                      <Calendar size={20} color="#F26B3A" />
                    </View>
                  </View>
                </Picker>
                <Text className="text-xs text-[#6B7280] mt-1 block">点击日历图标可选择历史日期补录数据</Text>
              </View>

              {/* 体重输入 */}
              <View>
                <Text className="text-sm font-medium text-[#1E2933] mb-2 block">体重</Text>
                <View className="bg-[#F0EDE6] rounded-xl px-4 py-3 flex items-center">
                  <Input
                    className="flex-1 bg-transparent text-base"
                    type="digit"
                    placeholder="请输入体重"
                    value={weight}
                    onInput={(e) => setWeight(e.detail.value)}
                  />
                  <Text className="text-sm text-[#6B7280] font-medium ml-2">kg</Text>
                </View>
              </View>

              {/* 腰围输入 */}
              <View>
                <Text className="text-sm font-medium text-[#1E2933] mb-2 block">腰围</Text>
                <View className="bg-[#F0EDE6] rounded-xl px-4 py-3 flex items-center">
                  <Input
                    className="flex-1 bg-transparent text-base"
                    type="digit"
                    placeholder="请输入腰围"
                    value={waist}
                    onInput={(e) => setWaist(e.detail.value)}
                  />
                  <Text className="text-sm text-[#6B7280] font-medium ml-2">cm</Text>
                </View>
              </View>

              {/* 备注输入 */}
              <View>
                <View className="flex items-center mb-2">
                  <Text className="text-sm font-medium text-[#1E2933]">备注</Text>
                  <Text className="text-sm text-[#6B7280] ml-1">(可选)</Text>
                </View>
                <View className="bg-[#F0EDE6] rounded-xl p-4">
                  <Textarea
                    className="w-full bg-transparent text-base"
                    placeholder="记录今天的感受或变化..."
                    maxlength={100}
                    value={note}
                    onInput={(e) => setNote(e.detail.value)}
                  />
                </View>
                <View className="flex justify-end mt-1">
                  <Text className="text-xs text-[#6B7280]">{note.length}/100</Text>
                </View>
              </View>

              {/* 提交按钮 */}
              <Button 
                className="w-full bg-[#F26B3A] text-white py-4 rounded-xl text-base font-semibold"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '提交中...' : '提交打卡'}
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 最近7天打卡记录 */}
        <View>
          <View className="flex items-center justify-between px-1 mb-3">
            <Text className="text-base font-semibold text-[#1E2933]">最近7天记录</Text>
            <Text 
              className="text-sm text-[#F26B3A] font-medium"
              onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
            >
              查看全部
            </Text>
          </View>

          <Card className="bg-white shadow-md">
            <CardContent className="p-0">
              {recentRecords.length === 0 ? (
                <View className="py-8 text-center">
                  <Text className="text-sm text-[#6B7280]">暂无记录</Text>
                </View>
              ) : (
                recentRecords.map((record, index) => (
                  <View 
                    key={record.id}
                    className={`flex items-center px-4 py-3 ${
                      index < recentRecords.length - 1 ? 'border-b border-[#E4DED2]' : ''
                    }`}
                  >
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-medium text-[#1E2933]">
                        {record.record_date.slice(5)}
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-1">
                        {formatDate(record.record_date)}
                      </Text>
                    </View>
                    <View className="flex items-center gap-4">
                      <Text className="text-sm text-[#1E2933] font-medium">
                        {record.weight}
                        <Text className="text-[#6B7280] font-normal ml-1">kg</Text>
                      </Text>
                      <Text className="text-sm text-[#1E2933] font-medium">
                        {record.waist}
                        <Text className="text-[#6B7280] font-normal ml-1">cm</Text>
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

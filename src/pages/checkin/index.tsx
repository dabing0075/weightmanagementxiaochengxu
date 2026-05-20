import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

interface WeightRecord {
  id: string
  record_date: string
  weight: string
  waist?: string
  note?: string
}

export default function CheckinPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<WeightRecord[]>([])

  useDidShow(() => {
    fetchRecentRecords()
  })

  const fetchRecentRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await Network.request({
        url: `/api/records/recent?days=7`,
        method: 'GET'
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setRecentRecords(res.data.data)
        const todayRec = res.data.data.find((r: WeightRecord) => r.record_date === today)
        setTodayRecord(todayRec || null)
      }
    } catch (error) {
      console.error('获取记录失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!weight) {
      Taro.showToast({ title: '请输入体重', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      const res = await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          record_date: date,
          weight: parseFloat(weight),
          waist: waist ? parseFloat(waist) : null,
          note: note || null
        }
      })

      if (res.data?.code === 200) {
        Taro.showToast({ title: '打卡成功', icon: 'success' })
        setWeight('')
        setWaist('')
        setNote('')
        fetchRecentRecords()
      } else {
        Taro.showToast({ title: res.data?.msg || '打卡失败', icon: 'none' })
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({ title: '打卡失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-background p-4">
      {/* 今日状态 */}
      {todayRecord && (
        <Card className="bg-success bg-opacity-10 border border-success border-opacity-20 mb-4">
          <CardContent className="p-4">
            <View className="flex items-center gap-2">
              <Badge className="bg-success text-white">已打卡</Badge>
              <Text className="text-sm text-success">今日已记录体重 {todayRecord.weight}kg</Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 打卡表单 */}
      <Card className="bg-surface shadow-card mb-4">
        <CardHeader>
          <CardTitle className="text-lg">记录数据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 日期选择 */}
          <View>
            <Text className="text-sm text-muted-foreground mb-2 block">日期</Text>
            <View className="bg-surface-container rounded-xl px-4 py-3">
              <Input 
                type="text"
                value={date}
                onInput={(e) => setDate(e.detail.value)}
                className="w-full bg-transparent text-on-surface"
                placeholder="选择日期"
              />
            </View>
          </View>

          {/* 体重输入 */}
          <View>
            <Text className="text-sm text-muted-foreground mb-2 block">体重 (kg) *</Text>
            <View className="bg-surface-container rounded-xl px-4 py-3">
              <Input 
                type="digit"
                value={weight}
                onInput={(e) => setWeight(e.detail.value)}
                className="w-full bg-transparent text-on-surface"
                placeholder="请输入体重，如 65.5"
              />
            </View>
          </View>

          {/* 腰围输入 */}
          <View>
            <Text className="text-sm text-muted-foreground mb-2 block">腰围 (cm)</Text>
            <View className="bg-surface-container rounded-xl px-4 py-3">
              <Input 
                type="digit"
                value={waist}
                onInput={(e) => setWaist(e.detail.value)}
                className="w-full bg-transparent text-on-surface"
                placeholder="请输入腰围，如 80"
              />
            </View>
          </View>

          {/* 备注输入 */}
          <View>
            <Text className="text-sm text-muted-foreground mb-2 block">备注（可选）</Text>
            <View className="bg-surface-container rounded-xl px-4 py-3">
              <Input 
                type="text"
                value={note}
                onInput={(e) => setNote(e.detail.value)}
                className="w-full bg-transparent text-on-surface"
                placeholder="记录今天的感受..."
                maxlength={100}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1 text-right block">
              {note.length}/100
            </Text>
          </View>

          {/* 提交按钮 */}
          <Button 
            className="w-full bg-primary text-white h-12"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交打卡'}
          </Button>
        </CardContent>
      </Card>

      {/* 最近记录 */}
      <Card className="bg-surface shadow-card">
        <CardHeader>
          <CardTitle className="text-base">最近7天记录</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length > 0 ? (
            <View className="space-y-3">
              {recentRecords.map((record) => (
                <View 
                  key={record.id}
                  className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0"
                >
                  <View>
                    <Text className="text-sm font-medium text-on-surface block">
                      {record.record_date}
                    </Text>
                    {record.note && (
                      <Text className="text-xs text-muted-foreground mt-1 block">
                        {record.note}
                      </Text>
                    )}
                  </View>
                  <View className="flex items-center gap-4">
                    <View className="text-right">
                      <Text className="text-xs text-muted-foreground block">体重</Text>
                      <Text className="text-sm font-semibold text-on-surface">{record.weight}kg</Text>
                    </View>
                    {record.waist && (
                      <View className="text-right">
                        <Text className="text-xs text-muted-foreground block">腰围</Text>
                        <Text className="text-sm font-semibold text-on-surface">{record.waist}cm</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8 text-center">
              <Text className="text-sm text-muted-foreground">暂无记录</Text>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  )
}

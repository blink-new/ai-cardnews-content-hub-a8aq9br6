import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  Users, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  age: number
  phone: string
  email: string
  insuranceType: string
  lastContactDate: string
  notes: string
}

interface CoverageAnalysis {
  id: string
  customerId: string
  insuranceType: string
  coverageAmount: number
  premiumAmount: number
  analysisDate: string
  recommendations: string
  customer: Customer
}

const COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

export default function CoverageAnalysisDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [analyses, setAnalyses] = useState<CoverageAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [customersData, analysesData] = await Promise.all([
        blink.db.customers.list({
          orderBy: { lastContactDate: 'desc' }
        }),
        blink.db.coverageAnalysis.list({
          orderBy: { analysisDate: 'desc' }
        })
      ])

      const formattedCustomers = customersData.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        age: Number(item.age) || 0,
        phone: item.phone || '',
        email: item.email || '',
        insuranceType: item.insurance_type || '',
        lastContactDate: item.last_contact_date || new Date().toISOString(),
        notes: item.notes || ''
      }))

      const formattedAnalyses = analysesData.map((item: any) => {
        const customer = formattedCustomers.find(c => c.id === item.customer_id)
        return {
          id: item.id,
          customerId: item.customer_id,
          insuranceType: item.insurance_type || '',
          coverageAmount: Number(item.coverage_amount) || 0,
          premiumAmount: Number(item.premium_amount) || 0,
          analysisDate: item.analysis_date || new Date().toISOString(),
          recommendations: item.recommendations || '',
          customer
        }
      }).filter(item => item.customer)

      setCustomers(formattedCustomers)
      setAnalyses(formattedAnalyses)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 통계 데이터 계산
  const getStatistics = () => {
    const totalCustomers = customers.length
    const totalCoverage = analyses.reduce((sum, analysis) => sum + (Number(analysis.coverageAmount) || 0), 0)
    const totalPremiums = analyses.reduce((sum, analysis) => sum + (Number(analysis.premiumAmount) || 0), 0)
    const avgAge = customers.length > 0 ? Math.round(customers.reduce((sum, customer) => sum + (Number(customer.age) || 0), 0) / customers.length) : 0

    return {
      totalCustomers,
      totalCoverage,
      totalPremiums,
      avgAge
    }
  }

  // 보험 유형별 분포 데이터
  const getInsuranceTypeDistribution = () => {
    const distribution: { [key: string]: number } = {}
    customers.forEach(customer => {
      distribution[customer.insuranceType] = (distribution[customer.insuranceType] || 0) + 1
    })

    return Object.entries(distribution).map(([type, count]) => ({
      name: type,
      value: count
    }))
  }

  // 연령대별 분포 데이터
  const getAgeDistribution = () => {
    const ageGroups = {
      '20대': 0,
      '30대': 0,
      '40대': 0,
      '50대+': 0
    }

    customers.forEach(customer => {
      const age = Number(customer.age) || 0
      if (age < 30) ageGroups['20대']++
      else if (age < 40) ageGroups['30대']++
      else if (age < 50) ageGroups['40대']++
      else ageGroups['50대+']++
    })

    return Object.entries(ageGroups).map(([group, count]) => ({
      name: group,
      count
    }))
  }

  // 월별 보험료 추이 (샘플 데이터)
  const getPremiumTrend = () => {
    return [
      { month: '1월', amount: 2400000 },
      { month: '2월', amount: 2600000 },
      { month: '3월', amount: 2800000 },
      { month: '4월', amount: 3200000 },
      { month: '5월', amount: 3100000 },
      { month: '6월', amount: 3400000 }
    ]
  }

  const statistics = getStatistics()
  const insuranceDistribution = getInsuranceTypeDistribution()
  const ageDistribution = getAgeDistribution()
  const premiumTrend = getPremiumTrend()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 고객 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalCustomers}명</div>
            <p className="text-xs text-muted-foreground">
              활성 고객 관리 중
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 보장 금액</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statistics.totalCoverage / 100000000).toFixed(1)}억원
            </div>
            <p className="text-xs text-muted-foreground">
              누적 보장 금액
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">월 보험료 총액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statistics.totalPremiums / 10000).toFixed(0)}만원
            </div>
            <p className="text-xs text-muted-foreground">
              월 납입 보험료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 연령</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgAge}세</div>
            <p className="text-xs text-muted-foreground">
              고객 평균 연령
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보험 유형별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>보험 유형별 고객 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insuranceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {insuranceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 연령대별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>연령대별 고객 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 월별 보험료 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 보험료 수입 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={premiumTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${(Number(value) / 10000).toFixed(0)}만원`, '보험료']} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>고객 관리 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.slice(0, 10).map((customer) => {
              const analysis = analyses.find(a => a.customerId === customer.id)
              const daysSinceContact = customer.lastContactDate ? Math.floor(
                (new Date().getTime() - new Date(customer.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
              ) : 999
              
              return (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium">{customer.name}</h3>
                      <Badge variant="outline">{customer.age}세</Badge>
                      <Badge variant="secondary">{customer.insuranceType}</Badge>
                      {daysSinceContact > 30 && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>장기 미접촉</span>
                        </Badge>
                      )}
                      {daysSinceContact <= 7 && (
                        <Badge variant="default" className="flex items-center space-x-1 bg-green-500">
                          <CheckCircle className="w-3 h-3" />
                          <span>최근 접촉</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>최근 접촉: {daysSinceContact}일 전</span>
                      </div>
                    </div>
                    {analysis && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <strong>보장분석:</strong> {analysis.recommendations}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {analysis && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          보장: {((Number(analysis.coverageAmount) || 0) / 10000).toFixed(0)}만원
                        </div>
                        <div className="text-sm text-muted-foreground">
                          월납: {((Number(analysis.premiumAmount) || 0) / 1000).toFixed(0)}천원
                        </div>
                      </div>
                    )}
                    <Button size="sm" className="mt-2">
                      상세보기
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
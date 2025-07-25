import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import CardNewsHub from './components/CardNewsHub'
import CoverageAnalysisDashboard from './components/CoverageAnalysisDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { BarChart3, FileText, User } from 'lucide-react'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="gradient-bg rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">AI 카드뉴스 허브</h1>
          <p className="text-muted-foreground mb-6">
            보험 설계사를 위한 스마트 콘텐츠 플랫폼
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            로그인하여 시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="gradient-bg rounded-lg w-10 h-10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI 카드뉴스 허브</h1>
                <p className="text-sm text-muted-foreground">스마트 콘텐츠 플랫폼</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <button
                onClick={() => blink.auth.logout()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="cardnews" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="cardnews" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>카드뉴스 허브</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>보장분석 대시보드</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cardnews" className="animate-fade-in">
            <CardNewsHub />
          </TabsContent>

          <TabsContent value="analysis" className="animate-fade-in">
            <CoverageAnalysisDashboard />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  )
}

export default App
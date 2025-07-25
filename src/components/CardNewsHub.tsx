import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Eye, Heart, MessageCircle, Share2, Crown, Search, Users } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface CardNews {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  category: string
  viewCount: number
  likeCount: number
  tags: string[]
  createdAt: string
}

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

interface AIRecommendation {
  id: string
  cardNewsId: string
  customerId: string
  reason: string
  confidenceScore: number
  customer: Customer
}

export default function CardNewsHub() {
  const [cardNews, setCardNews] = useState<CardNews[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [selectedCard, setSelectedCard] = useState<CardNews | null>(null)
  const [activeTab, setActiveTab] = useState('best')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadCardNews = useCallback(async () => {
    try {
      const data = await blink.db.cardNews.list({
        orderBy: { viewCount: 'desc' },
        limit: 50
      })
      
      const formattedData = data.map((item: any) => ({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        thumbnailUrl: item.thumbnail_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&crop=center',
        category: item.category || 'best',
        viewCount: Number(item.view_count) || 0,
        likeCount: Number(item.like_count) || 0,
        tags: (() => {
          try {
            return JSON.parse(item.tags || '[]')
          } catch {
            return []
          }
        })(),
        createdAt: item.created_at || new Date().toISOString()
      }))
      
      setCardNews(formattedData)
    } catch (error) {
      console.error('카드뉴스 로딩 실패:', error)
      toast({
        title: '오류',
        description: '카드뉴스를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadRecommendations = async () => {
    try {
      const data = await blink.db.aiRecommendations.list({
        orderBy: { confidenceScore: 'desc' },
        limit: 20
      })
      
      const customers = await blink.db.customers.list()
      
      const formattedData = data.map((item: any) => {
        const customer = customers.find((c: any) => c.id === item.customer_id)
        return {
          id: item.id,
          cardNewsId: item.card_news_id,
          customerId: item.customer_id,
          reason: item.reason || '',
          confidenceScore: Number(item.confidence_score) || 0,
          customer: customer ? {
            id: customer.id,
            name: customer.name || '',
            age: Number(customer.age) || 0,
            phone: customer.phone || '',
            email: customer.email || '',
            insuranceType: customer.insurance_type || '',
            lastContactDate: customer.last_contact_date || new Date().toISOString(),
            notes: customer.notes || ''
          } : null
        }
      }).filter(item => item.customer)
      
      setRecommendations(formattedData)
    } catch (error) {
      console.error('추천 데이터 로딩 실패:', error)
    }
  }

  useEffect(() => {
    loadCardNews()
    loadRecommendations()
  }, [loadCardNews])

  const getFilteredCardNews = () => {
    return cardNews.filter(card => card.category === activeTab)
  }

  const getRecommendationsForCard = (cardId: string) => {
    return recommendations.filter(rec => rec.cardNewsId === cardId)
  }

  const handleShareToKakao = (card: CardNews) => {
    // 실제 구현에서는 카카오톡 API를 사용
    toast({
      title: '카카오톡 공유',
      description: `"${card.title}" 콘텐츠가 공유되었습니다.`,
    })
  }

  const handleViewDetails = (card: CardNews) => {
    setSelectedCard(card)
    // 조회수 증가
    const currentViewCount = Number(card.viewCount) || 0
    blink.db.cardNews.update(card.id, {
      viewCount: currentViewCount + 1
    }).catch(error => {
      console.error('조회수 업데이트 실패:', error)
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'best':
        return <Crown className="w-4 h-4" />
      case 'designer_pick':
        return <Search className="w-4 h-4" />
      case 'customer_pick':
        return <Users className="w-4 h-4" />
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'best':
        return '👑 베스트 콘텐츠'
      case 'designer_pick':
        return '🔍 설계사\'s Pick'
      case 'customer_pick':
        return '👀 고객\'s Pick'
      default:
        return category
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="best" className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>베스트</span>
          </TabsTrigger>
          <TabsTrigger value="designer_pick" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>설계사 Pick</span>
          </TabsTrigger>
          <TabsTrigger value="customer_pick" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>고객 Pick</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredCardNews().map((card) => (
              <Card key={card.id} className="card-hover cursor-pointer group">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={card.thumbnailUrl}
                      alt={card.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&crop=center'
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-foreground">
                        {getCategoryIcon(card.category)}
                        <span className="ml-1">{getCategoryLabel(card.category).split(' ')[0]}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {card.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {card.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{(Number(card.viewCount) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{Number(card.likeCount) || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetails(card)}
                        >
                          자세히 보기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{selectedCard?.title}</DialogTitle>
                        </DialogHeader>
                        {selectedCard && (
                          <div className="space-y-6">
                            <img
                              src={selectedCard.thumbnailUrl}
                              alt={selectedCard.title}
                              className="w-full h-64 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&crop=center'
                              }}
                            />
                            <div>
                              <h3 className="text-lg font-semibold mb-2">콘텐츠 설명</h3>
                              <p className="text-muted-foreground">{selectedCard.description}</p>
                            </div>
                            
                            {/* AI 추천 고객 */}
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center">
                                🤖 이 콘텐츠를 추천하는 고객
                              </h3>
                              <div className="space-y-3">
                                {getRecommendationsForCard(selectedCard.id).map((rec) => (
                                  <Card key={rec.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <h4 className="font-medium">{rec.customer.name}</h4>
                                          <Badge variant="outline">
                                            {rec.customer.age}세
                                          </Badge>
                                          <Badge variant="secondary">
                                            {rec.customer.insuranceType}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {rec.reason}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                          연락처: {rec.customer.phone} | 이메일: {rec.customer.email}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-primary">
                                          {Math.round((Number(rec.confidenceScore) || 0) * 100)}% 매칭
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex items-center space-x-1"
                      onClick={() => handleShareToKakao(card)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>카톡 전송</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {getFilteredCardNews().length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {getCategoryLabel(activeTab)} 카테고리에 콘텐츠가 없습니다.
          </div>
        </div>
      )}
    </div>
  )
}
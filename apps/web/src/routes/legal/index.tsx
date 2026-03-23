import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/vtabs'
import { gizlilikVeGuvenlik, iptalIade } from '@/utils/legalstuff'
import Markdown from 'react-markdown'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/legal/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue='privacy'>
          <TabsList>
            <TabsTrigger value="privacy">Gizlilik ve Güvenlik</TabsTrigger>
            <TabsTrigger value="refund">İptal ve İade</TabsTrigger>
          </TabsList>
          <TabsContent className='prose' value="privacy">
            <Markdown>
              {gizlilikVeGuvenlik}
            </Markdown>
          </TabsContent>
          <TabsContent className='prose' value="refund">
            <Markdown>
              {iptalIade}
            </Markdown>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

import Loader from '@/components/loader'
import { orpc } from '@/utils/orpc'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from '@/components/ui/input'
import { Search, ShoppingBasket } from 'lucide-react'

export const Route = createFileRoute('/dashboard/customers')({
  component: RouteComponent,
})

function RouteComponent() {
  const customers = useQuery(orpc.customerRouter.getCustomers.queryOptions())
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!customers.data) return []
    if (!searchTerm.trim()) return customers.data

    const term = searchTerm.toLowerCase()
    
    return customers.data.filter(customer => {
      const name = (customer.name || '').toLowerCase()
      const email = (customer.email || '').toLowerCase()
      
      return name.includes(term) || email.includes(term)
    })
  }, [customers.data, searchTerm])

  if (customers.isLoading) return <Loader />

  const hasData = customers.data && customers.data.length > 0

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold">Müşteri Yönetimi</CardTitle>
            <CardDescription className="mt-1">
              Toplam {customers.data?.length || 0} müşteri
            </CardDescription>
          </div>
          {hasData && (
            <div className="flex items-center gap-2 w-full md:w-auto md:max-w-xl bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input 
                placeholder="Müşteri Ara..." 
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-9 w-full sm:w-72"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBasket />
                </EmptyMedia>
                <EmptyTitle>Hiç müşteri yok</EmptyTitle>
                <EmptyDescription>
                  Müşteri ve sepet bilgileri bulunamadı.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="border rounded-md bg-white">
              <Table>
                <TableCaption>Müşteri listesi.</TableCaption>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>İsim</TableHead>
                    <TableHead>Eposta</TableHead>
                    <TableHead className="text-right">Sepeti var mı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((data) => (
                    <TableRow key={data.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">{data.name}</TableCell>
                      <TableCell>{data.email}</TableCell>
                      <TableCell className="text-right">
                        {data.cart ? <InspectCart id={data.id} /> : "Hayır"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        Arama kriterlerine uygun müşteri bulunamadı
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InspectCart({ id }: { id: string }) {
  const peek = useMutation(orpc.customerRouter.getCustomerCart.mutationOptions())

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => peek.mutate(id)}>
          Sepeti incele
        </Button>
      </DialogTrigger>
      <DialogContent className="w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcı sepeti</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 w-full">
          {peek.isPending ? (
            <Loader />
          ) : (
            peek.data?.items?.map((x) => {
              if (!x.product) return null
              return (
                <div
                  key={x.id}
                  className="flex items-center gap-3 border-b pb-2"
                >
                  <div className="relative w-14 h-14 rounded overflow-hidden">
                    {x.product.imageUrls?.[0] && (
                      <img
                        src={x.product.imageUrls[0]}
                        alt={x.product.name}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{x.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {x.Size ? `Beden: ${x.Size.size} ` : ""}
                      {x.Color ? `Renk: ${x.Color.color}` : ""}
                    </p>
                    <p className="text-sm">
                      {x.quantity} × {x.product.price}₺
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button">
              Kapat
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

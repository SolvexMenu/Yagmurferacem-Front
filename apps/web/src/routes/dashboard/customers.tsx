import Loader from '@/components/loader'
import { orpc } from '@/utils/orpc'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
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
import { ShoppingBasket } from 'lucide-react'

export const Route = createFileRoute('/dashboard/customers')({
  component: RouteComponent,
})

function RouteComponent() {
  const customers = useQuery(orpc.customerRouter.getCustomers.queryOptions())

  if (customers.isLoading) return <Loader />

  const hasCustomers = customers.data && customers.data.length > 0

  return (
    <div className="p-8">
      {!hasCustomers ? (
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
        <Table>
          <TableCaption>Müşteri listesi.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>İsim</TableHead>
              <TableHead>Eposta</TableHead>
              <TableHead>Sepeti var mı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.data.map((data) => (
              <TableRow key={data.id}>
                <TableCell className="font-medium">{data.name}</TableCell>
                <TableCell>{data.email}</TableCell>
                <TableCell>
                  {data.cart ? <InspectCart id={data.id} /> : "Hayır"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
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
            peek.data?.items?.map((x) => (
              <div
                key={x.id}
                className="flex items-center gap-3 border-b pb-2"
              >
                <div className="relative w-14 h-14 rounded overflow-hidden">
                  <img
                    src={x.product.imageUrls[0]}
                    alt={x.product.name}
                    className="object-cover"
                  />
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
            ))
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

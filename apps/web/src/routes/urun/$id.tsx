import Loader from '@/components/loader'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Instagram, Minus, Plus, Share2, ShoppingBag } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { useLocalCart } from '@/state/cart'
import { authClient } from '@/lib/auth-client'
import { ProductCard } from '..'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'

// I'm assuming your ORPC query will return data with this shape, including variants.
// You might need to adjust your backend `getProductById` procedure accordingly.
type ProductData = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrls: string[];
  // These are the lists for populating the selectors
  colors: { id: string; color: string; }[];
  sizes: { id: string; size: number; }[];
  // This is the crucial list for checking availability of combinations
  variants: {
    id: string;
    color: string;
    size: number;
    available: boolean;
    stock: number;
  }[];
}

export const Route = createFileRoute('/urun/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: session } = authClient.useSession()
  const isLoggedIn = !!session?.user

  // The 'data' type is now explicitly defined for better autocompletion and safety.
  const { data: product, isLoading } = useQuery(orpc.productRouter.getProductById.queryOptions({ input: id }))
  const addToServerCart = useMutation(orpc.cartRouter.addItem.mutationOptions())
  const { addItem: addToLocalCart } = useLocalCart()
  const similar = useQuery(orpc.productRouter.getSimilarProducts.queryOptions({ input: id }));

  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // State now stores the primitive values, which is simpler for matching.
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  // This effect now runs when the product data is available.
  // It intelligently selects the *first available variant* as the default.
  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrls?.[0]);

      // Find the first variant that is in stock and set it as the default selection
      const firstAvailableVariant = product.variants.find(v => v.available && v.stock > 0);
      if (firstAvailableVariant) {
        // const matchingColor = product.Color.find(c => c.color === firstAvailableVariant.color);
        // if (matchingColor) {
        //   setSelectedColorId(matchingColor.id);
        // }
        // const matchingSize = product.Size.find(s => s.size === firstAvailableVariant.size);
        // if (matchingSize) {
        //   setSelectedSize(matchingSize.id);
        // }
      } else {
        // If no variant is available, select the first color/size anyway to show something
        // setSelectedColorId(product.Color[0]?.id);
        // setSelectedSize(product.Size[0]?.id);
      }

      // Eğer tek beden varsa (size !== 0 olanlardan), otomatik seç
      const availableSizes = product.Size.filter(size => size.size !== 0);
      if (availableSizes.length === 1) {
        setSelectedSize(availableSizes[0].id);
      }
    }
  }, [product])

  // Sync carousel with selected image
  useEffect(() => {
    if (carouselApi && selectedImage && product) {
      const imageIndex = product.imageUrls?.indexOf(selectedImage) as number;
      if (imageIndex !== -1) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  }, [carouselApi, selectedImage, product])

  const loadPayTRScript = () => {
    // Check if div exists before loading script
    const targetDiv = document.getElementById('paytr_taksit_tablosu');
    if (!targetDiv) return;

    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="paytr.com/odeme/taksit-tablosu"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://www.paytr.com/odeme/taksit-tablosu/v2?token=67cb5dce695fc1821bff5f80990ac89f4938591e6b77b7685422f81d306344e8&merchant_id=629430&amount=${product?.price}&taksit=0&tumu=0`;
    script.async = true;
    document.body.appendChild(script);
  };

  // --- Derived State using useMemo for performance ---
  const selectedColorName = useMemo(() => {
    if (!product || !selectedColorId) return undefined;
    return product.Color.find(c => c.id === selectedColorId)?.color;
  }, [product, selectedColorId]);

  // Find the specific variant that matches the user's current selection.
  const currentVariant = useMemo(() => {
    if (!product || !selectedColorName || !selectedSize) return null;
    const sizeObj = product.Size.find(s => s.id === selectedSize);
    if (!sizeObj) return null;
    return product.variants.find(
      v => v.color === selectedColorName && v.size === sizeObj.size
    );
  }, [product, selectedColorName, selectedSize]);

  const isAddToCartDisabled = !currentVariant || !currentVariant.available || currentVariant.stock < quantity;

  const handleAddToCart = async () => {
    if (!currentVariant || isAddToCartDisabled || !product || !selectedColorId || !selectedSize) return;

    if (isLoggedIn) {
      // Giriş yapmış kullanıcı - server sepetine ekle
      console.log(`Adding to server cart: Variant ID ${currentVariant.id}, Quantity: ${quantity}`);
      await addToServerCart.mutateAsync({
        colorId: selectedColorId,
        sizeId: selectedSize,
        quantity,
        productId: product.id
      });
      await queryClient.invalidateQueries({ queryKey: orpc.cartRouter.getCart.queryKey() })
    } else {
      // Giriş yapmamış kullanıcı - localStorage sepetine ekle
      console.log(`Adding to local cart: Product ID ${product.id}, Quantity: ${quantity}`);

      // Ürün bilgilerini cache'le
      const selectedColor = product.Color.find(c => c.id === selectedColorId);
      const selectedSizeObj = product.Size.find(s => s.id === selectedSize);

      addToLocalCart({
        productId: product.id,
        sizeId: selectedSize,
        colorId: selectedColorId,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrls: product.imageUrls as string[]
        },
        size: selectedSizeObj ? {
          id: selectedSizeObj.id,
          size: selectedSizeObj.size
        } : undefined,
        color: selectedColor ? {
          id: selectedColor.id,
          color: selectedColor.color
        } : undefined
      });
    }
  };

  if (isLoading && similar.isLoading) return <Loader />
  if (!product) return <div>Ürün bulunamadı.</div>

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="container mx-auto bg-white p-6 rounded-lg shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Product Image Gallery */}
          <div className="flex flex-col gap-4">
            <Carousel setApi={setCarouselApi}>
              <CarouselContent>
                {product.imageUrls?.map((image, index) => (
                  <CarouselItem key={image}>
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full max-w-md h-auto object-cover rounded-2xl shadow-lg mx-auto"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex gap-2 mt-4 justify-center">
                {product.imageUrls?.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => {
                      setSelectedImage(image);
                      carouselApi?.scrollTo(index);
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === image
                      ? 'border-ferace ring-2 ring-ferace/20'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </Carousel>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-2xl lg:text-3xl font-medium text-gray-900 mb-4">
              ₺{product.discount ? `${product.price - (product.price * product.discount / 100)}` : `${product.price}`}
            </p>

            {/* Color Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Renk: <span className="font-bold">{selectedColorName}</span></h3>
              <div className="flex flex-wrap items-center space-x-3">
                {product.Color.map((color) => (
                  // <button
                  //   key={color.id}
                  //   onClick={() => setSelectedColorId(color.id)}
                  //   // This assumes color.color is a valid CSS color (e.g., 'red', '#FF0000')
                  //   style={{ backgroundColor: color.color }}
                  //   className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 ${selectedColorId === color.id ? 'ring-2 ring-offset-1 ring-primary border-white' : 'border-gray-300'}`}
                  //   title={color.color}
                  // />
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorId(color.id)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200 
                        ${selectedColorId === color.id
                        ? 'bg-primary text-white border-foreground'
                        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                      }
                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:line-through
                      `}
                  >
                    {color.color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            {product.Size.filter(size => size.size !== 0).length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Beden:</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {product.Size.map((size) => {
                    if (size.size === 0) {
                      return null;
                    }

                    const isSizeAvailableForColor = product.variants.some(
                      v => v.color === selectedColorName && v.size === size.size && v.available && v.stock > 0
                    );
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        disabled={!isSizeAvailableForColor}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200 
                        ${selectedSize === size.id
                            ? 'bg-primary text-white border-foreground'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                          }
                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:line-through
                      `}
                      >
                        {size.size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Display stock information for the selected variant */}
            {currentVariant && currentVariant.stock < 10 && currentVariant.available && (
              <p className='text-red-500 font-semibold mb-4'>
                Sınırlı stok! Sadece {currentVariant.stock} adet kaldı.
              </p>
            )}

            {/* Quantity and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center">
                <Button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="rounded-l-md"
                  size={"icon"}
                  aria-label="Decrease quantity"
                  variant={"outline"}
                ><Minus className="w-4 h-4" /></Button>
                <span className="px-4 py-2 font-semibold text-gray-800 w-12 text-center">{quantity}</span>
                <Button
                  onClick={() => setQuantity(q => q + 1)}
                  // Prevent increasing quantity beyond available stock
                  disabled={!!currentVariant && quantity >= currentVariant.stock}
                  className="rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                  variant={"outline"}
                  size={"icon"}
                ><Plus className="w-4 h-4" /></Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={isAddToCartDisabled}
                className="w-fit sm:w-auto flex-grow flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="mr-2" />
                {isAddToCartDisabled ? (currentVariant ? 'Stokta Yok' : 'Seçim Yapın') : 'Sepete Ekle'}
              </Button>
            </div>

            <div className='mt-4'>
              <Button variant={"ghost"} onClick={() => navigator.clipboard.writeText("https://yagmurferacem.com/urun/" + id)}>
                <Share2 /> Paylaş
              </Button>
            </div>

            <div className='mt-8'>
              <Accordion defaultValue='item-1' type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className='text-xl'>Ürün Bilgisi</AccordionTrigger>
                  <AccordionContent className='prose' asChild>
                    <Markdown rehypePlugins={[rehypeRaw]}>
                      {product.description}
                    </Markdown>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger
                    className='text-xl'
                    onClick={() => {
                      // Load script when accordion opens
                      setTimeout(loadPayTRScript, 100);
                    }}
                  >
                    Taksit Bilgisi
                  </AccordionTrigger>
                  <AccordionContent>
                    <div id="paytr_taksit_tablosu"></div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        <section className='my-8'>
          <div className="flex flex-col items-center justify-center my-4 space-y-4">
            <span className="text-4xl">Benzer Ürünler</span>
            <svg width="61" height="15" className="w-96" viewBox="0 0 61 15" fill="none">
              <path d="M59 3L49.5 12L40 3L30.5 12L21 3L11.5 12L2 3" stroke="#E5E5E5" strokeWidth="3"></path>
            </svg>
          </div>
        </section>

        <div className="flex items-center justify-center flex-row gap-3 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-2">
            {similar.data?.map((data) => (
              <ProductCard imageClass="max-h-96" id={data.id} img={data.imageUrls?.[0] as string} name={data.name} price={`${data.price}`} key={data.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
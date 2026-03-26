import { orpc } from "@/utils/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [carouselInput, setCarouselInput] = useState("");
  const [separatorInput, setSeparatorInput] = useState("");
  const [shippingPriceInput, setShippingPriceInput] = useState("");

  const { data: carousel, isLoading: carouselLoading } = useQuery(orpc.bannerRouter.getCarousel.queryOptions());

  const { data: separator, isLoading: separatorLoading } = useQuery(orpc.bannerRouter.getSeparator.queryOptions());

  const { data: shippingPrice, isLoading: shippingPriceLoading } = useQuery(orpc.bannerRouter.getShippingPrice.queryOptions());

  const updateCarouselMutation = useMutation(orpc.bannerRouter.updateCarousel.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.bannerRouter.getCarousel.queryKey() });
      setCarouselInput("");
    },
  }))

  const updateSeparatorMutation = useMutation(orpc.bannerRouter.updateSeparator.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.bannerRouter.getSeparator.queryKey() });
      setSeparatorInput("");
    },
  }))

  const updateShippingPriceMutation = useMutation(orpc.bannerRouter.updateShippingPrice.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.bannerRouter.getShippingPrice.queryKey() });
      setShippingPriceInput("");
    },
  }))

  const handleAddCarousel = () => {
    if (carouselInput.trim()) {
      const newCarousel = [...(carousel || []), carouselInput.trim()];
      updateCarouselMutation.mutate(newCarousel);
    }
  };

  const handleRemoveCarousel = (index: number) => {
    const newCarousel = carousel?.filter((_, i) => i !== index) || [];
    if (newCarousel.length > 0) {
      updateCarouselMutation.mutate(newCarousel);
    }
  };

  const handleUpdateSeparator = () => {
    if (separatorInput.trim()) {
      updateSeparatorMutation.mutate(separatorInput.trim());
    }
  };

  const handleUpdateShippingPrice = () => {
    const price = parseFloat(shippingPriceInput);
    if (!isNaN(price) && price >= 0) {
      updateShippingPriceMutation.mutate(price);
    }
  };

  return (
    <div className="p-4 md:w-2/3 lg:w-2/3 mx-auto" >
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Carousel Bannerları</h2>

        {carouselLoading ? (
          <p className="text-gray-500">Yükleniyor...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {carousel && carousel.length > 0 ? (
                carousel.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                    <img src={url} alt={`Carousel ${index + 1}`} className="w-20 h-12 object-cover rounded" />
                    <span className="flex-1 text-sm truncate">{url}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCarousel(index)}
                      disabled={updateCarouselMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Henüz carousel banner eklenmemiş</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Banner URL'si girin"
                value={carouselInput}
                onChange={(e) => setCarouselInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCarousel()}
              />
              <Button
                onClick={handleAddCarousel}
                disabled={!carouselInput.trim() || updateCarouselMutation.isPending}
              >
                Ekle
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Ayırıcı Banner</h2>

        {separatorLoading ? (
          <p className="text-gray-500">Yükleniyor...</p>
        ) : (
          <div className="space-y-4">
            {separator && (
              <div className="p-3 bg-gray-50 rounded">
                <img src={separator} alt="Separator" className="w-full h-auto rounded mb-2" />
                <p className="text-sm text-gray-600 truncate">{separator}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Banner URL'si girin"
                value={separatorInput}
                onChange={(e) => setSeparatorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateSeparator()}
              />
              <Button
                onClick={handleUpdateSeparator}
                disabled={!separatorInput.trim() || updateSeparatorMutation.isPending}
              >
                Güncelle
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Kargo Ücreti</h2>

        {shippingPriceLoading ? (
          <p className="text-gray-500">Yükleniyor...</p>
        ) : (
          <div className="space-y-4">
            {shippingPrice !== undefined && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-lg font-medium">Mevcut Kargo Ücreti: ₺{shippingPrice}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Yeni kargo ücreti (₺)"
                value={shippingPriceInput}
                onChange={(e) => setShippingPriceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateShippingPrice()}
                min="0"
                step="0.01"
              />
              <Button
                onClick={handleUpdateShippingPrice}
                disabled={!shippingPriceInput.trim() || updateShippingPriceMutation.isPending}
              >
                Güncelle
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import Loader from "./loader";

const imgs = [
  "https://www.feracemyagmur.com/idea/oq/07/themes/selftpl_66fb9f51159b4/assets/uploads/slider_1.jpg?revision=8.0.0.0-2-1758372471",
  "https://www.feracemyagmur.com/idea/oq/07/themes/selftpl_66fb9f51159b4/assets/uploads/slider_2.jpg?revision=8.0.0.0-2-1758372471"
]

export function CarouselDemo() {
  const carousel = useQuery(orpc.bannerRouter.getCarousel.queryOptions())
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (carousel.isLoading) return <Loader />

  return (
    <div className="mx-auto md:w-[90rem]">
      <Carousel setApi={setApi} className="w-full max-w-full">
        <CarouselContent>
          {carousel.data?.map((_, index) => (
            <CarouselItem key={index}>
              <div className={cn(
                "text-primary-foreground transition-all duration-500",
                {
                  "opacity-30": index !== current - 1,
                }
              )}>
                {/* <span className="text-4xl font-semibold">{index + 1}</span> */}
                <img className="rounded-lg" src={_} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-4 flex items-center justify-center gap-2">
        {imgs.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn("h-3.5 w-3.5 rounded-full border-2", {
              "border-ferace": current === index + 1,
            })}
          />
        ))}
      </div>
    </div>
  );
}

/*
"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export default function SlideOpacity() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="mx-auto max-w-xs">
      <Carousel
        setApi={setApi}
        className="w-full max-w-xs mx-2"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="basis-3/5">
              <Card
                className={cn(
                  "bg-primary text-primary-foreground transition-all duration-500",
                  {
                    "opacity-30": index !== current - 1,
                  }
                )}
              >
                <CardContent className="flex aspect-video items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
 */
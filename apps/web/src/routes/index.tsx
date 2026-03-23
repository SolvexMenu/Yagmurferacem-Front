import Loader from "@/components/loader";
import { CarouselDemo } from "@/components/swiper";
import { orpc } from "@/utils/orpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const separator = useQuery(orpc.bannerRouter.getSeparator.queryOptions())
	const rando = useSuspenseQuery(orpc.productRouter.getRandom4Product.queryOptions())

	return (
		<div>
			<div className="mt-2 rounded-lg">
				{/* <Carousel
					items={carouselItems}
					showArrows={false}
					autoPlay={true}
				/> */}
				<CarouselDemo />
			</div>

			<div className="flex flex-col items-center justify-center my-4 space-y-4">
				<span className="text-4xl">Önerilen Ürünler</span>
				<svg width="61" height="15" className="w-96" viewBox="0 0 61 15" fill="none">
					<path d="M59 3L49.5 12L40 3L30.5 12L21 3L11.5 12L2 3" stroke="#E5E5E5" strokeWidth="3"></path>
				</svg>
			</div>

			{/* <div className="container grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
				<Thing />
				<Thing />
				<Thing />
				<Thing />
			</div> */}

			<Suspense fallback={<Loader />}>
				{/* <pre>{JSON.stringify(list, null, 2)}</pre> */}
				<div className="flex items-center justify-center flex-row gap-3 mt-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-2">
						{rando.data?.map((data) => (
							<ProductCard imageClass="max-h-96" id={data.id} img={data.imageUrls?.[0] || ""} name={data.name} price={`${data.price}`} key={data.id} />
						))}
					</div>
				</div>
			</Suspense>

			<div className="mx-auto md:w-[100rem]">
				<img className="rounded-lg mx-2" src={separator.data} />
			</div>

			<div className="flex flex-col items-center justify-center my-4 space-y-4">
				<span className="text-4xl">Yeni Ürünler</span>
				<svg width="61" height="15" className="w-96" viewBox="0 0 61 15" fill="none">
					<path d="M59 3L49.5 12L40 3L30.5 12L21 3L11.5 12L2 3" stroke="#E5E5E5" strokeWidth="3"></path>
				</svg>
			</div>

			<Suspense fallback={<Loader />}>
				{/* <pre>{JSON.stringify(list, null, 2)}</pre> */}
				<div className="flex items-center justify-center flex-row gap-3 mt-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-2">
						{rando.data?.map((data) => (
							<ProductCard imageClass="max-h-96" id={data.id} img={data.imageUrls?.[0] || ""} name={data.name} price={`${data.price}`} key={data.id} />
						))}
					</div>
				</div>
			</Suspense>
		</div>
	);
}

interface IProductCard {
	name: string;
	img: string;
	price: string;
	id: string;
	imageClass?: string;
	originalPrice?: string;
	discountPercentage?: number;
}

export function Thing(props: IProductCard) {
	return (
		<div className="showcase">
			<section className="border border-border">
				<Link to="/urun/$id" params={{ id: props.id }}>
					<img className={"w-fit " + props.imageClass} src={props.img} alt="Zehra Ferace" />
				</Link>
			</section>
			<div className="showcase-content">
				<div className="showcase-title">
					<Link to="/urun/$id" params={{ id: props.id }}>{props.name}</Link>
				</div>
				<div className="showcase-price">
					<div className="showcase-price-new">
						{props.price} TL
					</div>
				</div>
				<div className="showcase-hover">
					<div className="showcase-view">
						<Link to="/urun/$id" params={{ id: props.id }}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M3.11799 12.467C2.96099 12.176 2.96099 11.823 3.11799 11.532C5.00999 8.033 8.50499 5 12 5C15.495 5 18.99 8.033 20.882 11.533C21.039 11.824 21.039 12.177 20.882 12.468C18.99 15.967 15.495 19 12 19C8.50499 19 5.00999 15.967 3.11799 12.467V12.467Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M14.1213 9.87868C15.2929 11.0502 15.2929 12.9497 14.1213 14.1213C12.9497 15.2929 11.0502 15.2929 9.87868 14.1213C8.70711 12.9497 8.70711 11.0502 9.87868 9.87868C11.0502 8.70711 12.9497 8.70711 14.1213 9.87868Z" stroke="black" strokeWidth="1.4286" strokeLinecap="round" strokeLinejoin="round"></path>
							</svg>
						</Link>
					</div>
					<div className="showcase-buttons">
						<a href="javascript:void(0);" className="add-to-cart-button" data-selector="add-to-cart" data-context="showcase" data-product-id="11913">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M5.96905 6.625L5.30205 3.625H3.37305" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M7.73124 14.835L5.96924 6.625H18.6272C19.2642 6.625 19.7382 7.212 19.6052 7.835L18.1032 14.835C18.0042 15.296 17.5972 15.625 17.1252 15.625H8.70824C8.23724 15.625 7.83024 15.296 7.73124 14.835Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M17.4648 19.25C17.2578 19.25 17.0898 19.418 17.0918 19.625C17.0918 19.832 17.2598 20 17.4668 20C17.6738 20 17.8418 19.832 17.8418 19.625C17.8408 19.418 17.6728 19.25 17.4648 19.25Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M8.85593 19.25C8.64893 19.25 8.48093 19.418 8.48293 19.625C8.48193 19.832 8.64993 20 8.85693 20C9.06393 20 9.23193 19.832 9.23193 19.625C9.23193 19.418 9.06393 19.25 8.85593 19.25Z" fill="white"></path>
								<path d="M8.85593 19.25C8.64893 19.25 8.48093 19.418 8.48293 19.625C8.48193 19.832 8.64993 20 8.85693 20C9.06393 20 9.23193 19.832 9.23193 19.625C9.23193 19.418 9.06393 19.25 8.85593 19.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
							</svg>
						</a>
					</div>
					<div className="showcase-favorites">
						<a href="javascript:void(0);" className="add-my-favorites" data-selector="add-my-favorites" data-product-id="11913" aria-label="Add To Favorites">
							<svg className="showcase-icon-favori" width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M7.5 4C4.46244 4 2 6.46245 2 9.5C2 15 8.5 20 12 21.1631C15.5 20 22 15 22 9.5C22 6.46245 19.5375 4 16.5 4C14.6399 4 12.9954 4.92345 12 6.3369C11.0046 4.92345 9.36015 4 7.5 4Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
							</svg>
							<svg className="showcase-icon-favori-add" width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M7.5 4C4.46244 4 2 6.46245 2 9.5C2 15 8.5 20 12 21.1631C15.5 20 22 15 22 9.5C22 6.46245 19.5375 4 16.5 4C14.6399 4 12.9954 4.92345 12 6.3369C11.0046 4.92345 9.36015 4 7.5 4Z" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
								<path d="M3 5L7.5 4L12 5.5L16.5 4L21 5L21.5 13L17 18L11.5 20.5L5 17L2.5 11L3 5Z" fill="#FF0000"></path>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}

export function ProductCard(props: IProductCard) {
	return (
		<div className="showcase">
			<div className="max-w-xs hover:cursor-pointer bg-white shadow-md overflow-hidden">
				<div className="relative">
					<Link to="/urun/$id" params={{ id: props.id }}>
						<img
							src={props.img}
							alt="Asil Elif Abaya"
							className="w-full h-80 object-cover"
						/>
					</Link>
					{/* <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-semibold px-2 py-1">
						Yeni Ürün
					</span> */}
					{props.discountPercentage && (
						<span className="absolute top-2 right-2 bg-ferace text-white text-xs font-bold px-2 py-1 rounded">
							-%{props.discountPercentage}
						</span>
					)}
				</div>
				<div className="showcase-content">
					<div className="showcase-title">
						<Link to="/urun/$id" params={{ id: props.id }}>{props.name}</Link>
					</div>
					<div className="showcase-price">
						{props.originalPrice && (
							<div className="showcase-price-old line-through text-gray-500 text-sm">
								{props.originalPrice} TL
							</div>
						)}
						<div className="showcase-price-new">
							{props.price} TL
						</div>
					</div>
					<div className="showcase-hover">
						<div className="showcase-view">
							<Link to="/urun/$id" params={{ id: props.id }}>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
									<path d="M3.11799 12.467C2.96099 12.176 2.96099 11.823 3.11799 11.532C5.00999 8.033 8.50499 5 12 5C15.495 5 18.99 8.033 20.882 11.533C21.039 11.824 21.039 12.177 20.882 12.468C18.99 15.967 15.495 19 12 19C8.50499 19 5.00999 15.967 3.11799 12.467V12.467Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
									<path d="M14.1213 9.87868C15.2929 11.0502 15.2929 12.9497 14.1213 14.1213C12.9497 15.2929 11.0502 15.2929 9.87868 14.1213C8.70711 12.9497 8.70711 11.0502 9.87868 9.87868C11.0502 8.70711 12.9497 8.70711 14.1213 9.87868Z" stroke="black" strokeWidth="1.4286" strokeLinecap="round" strokeLinejoin="round"></path>
								</svg>
							</Link>
						</div>
						{/* <div className="showcase-buttons">
							<a href="javascript:void(0);" className="add-to-cart-button" data-selector="add-to-cart" data-context="showcase" data-product-id="11913">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
									<path d="M5.96905 6.625L5.30205 3.625H3.37305" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
									<path d="M7.73124 14.835L5.96924 6.625H18.6272C19.2642 6.625 19.7382 7.212 19.6052 7.835L18.1032 14.835C18.0042 15.296 17.5972 15.625 17.1252 15.625H8.70824C8.23724 15.625 7.83024 15.296 7.73124 14.835Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
									<path d="M17.4648 19.25C17.2578 19.25 17.0898 19.418 17.0918 19.625C17.0918 19.832 17.2598 20 17.4668 20C17.6738 20 17.8418 19.832 17.8418 19.625C17.8408 19.418 17.6728 19.25 17.4648 19.25Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
									<path d="M8.85593 19.25C8.64893 19.25 8.48093 19.418 8.48293 19.625C8.48193 19.832 8.64993 20 8.85693 20C9.06393 20 9.23193 19.832 9.23193 19.625C9.23193 19.418 9.06393 19.25 8.85593 19.25Z" fill="white"></path>
									<path d="M8.85593 19.25C8.64893 19.25 8.48093 19.418 8.48293 19.625C8.48193 19.832 8.64993 20 8.85693 20C9.06393 20 9.23193 19.832 9.23193 19.625C9.23193 19.418 9.06393 19.25 8.85593 19.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
								</svg>
							</a>
						</div> */}
						<div className="showcase-favorites">
							<a href="javascript:void(0);" className="add-my-favorites" data-selector="add-my-favorites" data-product-id="11913" aria-label="Add To Favorites">
								<svg className="showcase-icon-favori" width="24" height="24" viewBox="0 0 24 24" fill="none">
									<path d="M7.5 4C4.46244 4 2 6.46245 2 9.5C2 15 8.5 20 12 21.1631C15.5 20 22 15 22 9.5C22 6.46245 19.5375 4 16.5 4C14.6399 4 12.9954 4.92345 12 6.3369C11.0046 4.92345 9.36015 4 7.5 4Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
								</svg>
								<svg className="showcase-icon-favori-add" width="24" height="24" viewBox="0 0 24 24" fill="none">
									<path d="M7.5 4C4.46244 4 2 6.46245 2 9.5C2 15 8.5 20 12 21.1631C15.5 20 22 15 22 9.5C22 6.46245 19.5375 4 16.5 4C14.6399 4 12.9954 4.92345 12 6.3369C11.0046 4.92345 9.36015 4 7.5 4Z" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
									<path d="M3 5L7.5 4L12 5.5L16.5 4L21 5L21.5 13L17 18L11.5 20.5L5 17L2.5 11L3 5Z" fill="#FF0000"></path>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
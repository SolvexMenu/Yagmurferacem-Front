import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { link, orpc } from "@/utils/orpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "../../../server/src/routers";
import { createORPCClient } from "@orpc/client";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";
import "../theme.css";
import DebugStuff from "@/components/debug";
import Footer from "@/components/footer";
import { useCartSync } from "@/hooks/use-cart-sync";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Yağmur Feracem | Tesettür Elbiseler, Ferace, Abaya Takımı",
			},
			{
				name: "description",
				content: "Feracem Yağmur’da her zevke uygun Tesettür Elbiseler, Ferace ve Abaya Takımları. Zarif detaylarla dolu kombinlerle göz kamaştırın!",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const isFetching = useRouterState({
		select: (s) => s.isLoading,
	});
	const location = useRouterState({
		select: (s) => s.location,
	});
	const isDashboard = location.pathname.startsWith('/dashboard');

	const [client] = useState<AppRouterClient>(() => createORPCClient(link));
	const [orpcUtils] = useState(() => createTanstackQueryUtils(client));
	
	// Sepet senkronizasyonu
	useCartSync();

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div>
					{!isDashboard && <Header />}
					{isFetching ? <Loader /> : <Outlet />}
					{/* <DebugStuff /> */}
					{!isDashboard && <Footer />}
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}

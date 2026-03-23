import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";
import CartMenu from "./cart-menu";
import { Boxes, LogOut, ShoppingBag, SquareDashedMousePointer, UserMinus2, UserRound } from "lucide-react";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-20" />;
	}

	if (!session || !session.user) {
		return (
			<div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-9 w-9">
							<UserRound className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<UserMinus2 />
								</EmptyMedia>
								<EmptyTitle>Hesabınız yok</EmptyTitle>
							</EmptyHeader>
							<EmptyContent>
								<Button variant="outline" size="sm" asChild>
									<Link to="/login">Giriş yap</Link>
								</Button>
							</EmptyContent>
						</Empty>
					</DropdownMenuContent>
				</DropdownMenu>

				<CartMenu />
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-9 w-9">
						<UserRound className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuLabel className="flex flex-col select-none items-center justify-center">
						<UserRound />
						<p>{session.user.email}</p>
					</DropdownMenuLabel>
					<DropdownMenuGroup>
						<Link to="/profil">
							<DropdownMenuItem>
								<Boxes className="mr-2 h-4 w-4" />
								Siparişlerim
							</DropdownMenuItem>
						</Link>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					{session.user.role === "ADMIN" && (
						<>
							<Link to="/dashboard">
								<DropdownMenuItem>
									<SquareDashedMousePointer className="mr-2 h-4 w-4" />
									Yönetim Paneli
								</DropdownMenuItem>
							</Link>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({ to: "/" });
									},
								},
							});
						}}
					>
						<LogOut className="mr-2 h-4 w-4" />
						Çıkış yap
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CartMenu />
		</div>
	);
}

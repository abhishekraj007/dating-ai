"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";

export default function Header() {
	const router = useRouter();
	const userData = useQuery(api.user.fetchUserAndProfile);

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
		{ to: "/todos", label: "Todos" },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} href={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					{userData ? (
						<UserMenu />
					) : (
						<Button onClick={() => router.push("/auth")}>Login</Button>
					)}
				</div>
			</div>
			<hr />
		</div>
	);
}

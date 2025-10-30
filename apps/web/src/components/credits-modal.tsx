"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { CheckoutLink } from "@convex-dev/polar/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap } from "lucide-react";

interface CreditsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
	const polarProducts = useQuery(api.lib.polar.products.getConfiguredProducts);
	const userCredits = useQuery(api.features.credits.queries.getUserCredits);

	const isLoading = polarProducts === undefined || userCredits === undefined;

	const getIcon = (index: number) => {
		switch (index) {
			case 0:
				return <Coins className="h-8 w-8 text-foreground" />;
			case 1:
				return <Sparkles className="h-8 w-8 text-foreground" />;
			case 2:
				return <Zap className="h-8 w-8 text-foreground" />;
			default:
				return <Coins className="h-8 w-8 text-foreground" />;
		}
	};

	// Map Polar products to credit packages
	const creditProducts = [
		{
			key: "credits1000",
			product: polarProducts?.credits1000,
			credits: 1000,
			label: "1,000 Credits",
			description: "Perfect for getting started",
		},
		{
			key: "credits2500",
			product: polarProducts?.credits2500,
			credits: 2500,
			label: "2,500 Credits",
			description: "Most popular choice",
			badge: "Popular",
		},
		{
			key: "credits5000",
			product: polarProducts?.credits5000,
			credits: 5000,
			label: "5,000 Credits",
			description: "For power users",
			badge: "Save 30%",
		},
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Buy Credits</DialogTitle>
					<DialogDescription>
						{userCredits && (
							<span className="text-lg font-semibold">
								Current Balance: {userCredits.credits.toLocaleString()} credits
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
							<p className="mt-4 text-muted-foreground">Loading options...</p>
						</div>
					</div>
				) : (
					<div className="grid md:grid-cols-3 gap-4 py-4">
						{creditProducts?.map((item, index: number) => {
							const priceId = item.product?.prices?.[0]?.id;
							const price = item.product?.prices?.[0]?.priceAmount
								? (item.product.prices[0].priceAmount / 100).toFixed(2)
								: "0.00";
							
							return (
								<Card
									key={item.key}
									className={
										item.badge === "Popular"
											? "border-primary shadow-lg relative"
											: "relative"
									}
								>
									{item.badge && (
										<div className="absolute top-0 right-4">
											<span
												className={`px-3 py-1 rounded-b-lg text-xs font-semibold ${
													item.badge === "Popular"
														? "bg-primary text-primary-foreground"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{item.badge}
											</span>
										</div>
									)}
									<CardHeader className="text-center">
										<div className="flex justify-center mb-2">{getIcon(index)}</div>
										<CardTitle className="text-xl">{item.label}</CardTitle>
										<CardDescription>{item.description}</CardDescription>
									</CardHeader>
									<CardContent className="text-center">
										<div className="mb-4">
											<span className="text-3xl font-bold">${price}</span>
										</div>
										<p className="text-sm text-muted-foreground">
											{item.credits.toLocaleString()} credits
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											${(parseFloat(price) / item.credits * 1000).toFixed(2)} per 1000 credits
										</p>
									</CardContent>
									<CardFooter>
										{priceId ? (
											<CheckoutLink
												polarApi={api.lib.polar.client}
												productIds={[priceId]}
												embed={true}
												className="w-full"
											>
												<Button className="w-full">Buy Now</Button>
											</CheckoutLink>
										) : (
											<Button className="w-full" disabled>
												Not Available
											</Button>
										)}
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}

				<div className="mt-4 text-center text-sm text-muted-foreground">
					<p>Credits never expire and can be used for any service</p>
					<p className="mt-1">
						Premium members get unlimited credits with their subscription
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

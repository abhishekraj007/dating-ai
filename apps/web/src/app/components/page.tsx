"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";

function CodeBlock({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative group">
			<pre className="p-4 bg-muted rounded-md overflow-x-auto text-xs font-mono">
				<code>{code}</code>
			</pre>
			<Button
				variant="ghost"
				size="icon"
				className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={handleCopy}
			>
				{copied ? (
					<Check className="h-3.5 w-3.5" />
				) : (
					<Copy className="h-3.5 w-3.5" />
				)}
			</Button>
		</div>
	);
}

function ComponentSection({
	title,
	description,
	children,
	code,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	code?: string;
}) {
	return (
		<section className="space-y-4 mb-12">
			<div>
				<h2 className="text-2xl font-semibold mb-2">{title}</h2>
				{description && (
					<p className="text-sm text-muted-foreground mb-4">{description}</p>
				)}
			</div>
			<div className="space-y-4">
				<div className="p-6 border rounded-lg bg-card">{children}</div>
				{code && <CodeBlock code={code} />}
			</div>
		</section>
	);
}

export default function ComponentsPage() {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div className="container mx-auto px-4 py-12 max-w-6xl">
			<div className="mb-12">
				<h1 className="text-4xl font-semibold mb-4">UI Components</h1>
				<p className="text-lg text-muted-foreground">
					Comprehensive documentation and examples of all available UI components
					and their variants.
				</p>
			</div>

			<ComponentSection
				title="Button"
				description="Button component with multiple variants and sizes"
				code={`import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Disabled
<Button disabled>Disabled</Button>`}
			>
				<div className="space-y-6">
					<div>
						<h3 className="text-sm font-medium mb-3">Variants</h3>
						<div className="flex flex-wrap gap-3">
							<Button variant="default">Default</Button>
							<Button variant="destructive">Destructive</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="link">Link</Button>
						</div>
					</div>
					<div>
						<h3 className="text-sm font-medium mb-3">Sizes</h3>
						<div className="flex items-center gap-3">
							<Button size="sm">Small</Button>
							<Button size="default">Default</Button>
							<Button size="lg">Large</Button>
							<Button size="icon">
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>
					<div>
						<h3 className="text-sm font-medium mb-3">States</h3>
						<div className="flex gap-3">
							<Button disabled>Disabled</Button>
							<Button>Enabled</Button>
						</div>
					</div>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Card"
				description="Card component with header, content, and footer sections"
				code={`import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`}
			>
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Card Title</CardTitle>
							<CardDescription>
								This is a description of the card component
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Card content area where you can place any content.
							</p>
						</CardContent>
						<CardFooter>
							<Button variant="outline">Action</Button>
						</CardFooter>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Another Card</CardTitle>
							<CardDescription>Demonstrating multiple cards</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Cards can be used in a grid layout for better organization.
							</p>
						</CardContent>
					</Card>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Input & Label"
				description="Form input and label components"
				code={`import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>

<Input disabled placeholder="Disabled input" />
<Input type="password" placeholder="Password" />`}
			>
				<div className="space-y-4 max-w-md">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Enter your password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="disabled">Disabled</Label>
						<Input id="disabled" disabled placeholder="Disabled input" />
					</div>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Checkbox"
				description="Checkbox component for form inputs"
				code={`import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>

<Checkbox id="checked" checked />
<Checkbox id="disabled" disabled />`}
			>
				<div className="space-y-4">
					<div className="flex items-center space-x-2">
						<Checkbox id="unchecked" />
						<Label htmlFor="unchecked">Unchecked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox id="checked" checked />
						<Label htmlFor="checked">Checked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox id="disabled" disabled />
						<Label htmlFor="disabled">Disabled</Label>
					</div>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Dialog"
				description="Modal dialog component for overlays and confirmations"
				code={`import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text goes here
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
			>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button>Open Dialog</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Dialog Title</DialogTitle>
							<DialogDescription>
								This is a dialog component example. Click outside or press ESC to
								close.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<p className="text-sm text-muted-foreground">
								Dialog content area where you can place any content.
							</p>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setDialogOpen(false)}>
								Cancel
							</Button>
							<Button onClick={() => setDialogOpen(false)}>Confirm</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</ComponentSection>

			<ComponentSection
				title="Dropdown Menu"
				description="Dropdown menu component with multiple item types"
				code={`import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
			>
				<div className="flex flex-wrap gap-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">Open Menu</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<Copy className="mr-2 h-4 w-4" />
								Profile
							</DropdownMenuItem>
							<DropdownMenuItem>Settings</DropdownMenuItem>
							<DropdownMenuItem>Team</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">With Checkbox</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuCheckboxItem checked>
								Show status
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem>Show sidebar</DropdownMenuCheckboxItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Settings</DropdownMenuLabel>
							<DropdownMenuCheckboxItem checked>
								Auto-save
							</DropdownMenuCheckboxItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">With Radio</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Theme</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup value="light">
								<DropdownMenuRadioItem value="light">
									Light
								</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">With Submenu</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>New Tab</DropdownMenuItem>
							<DropdownMenuItem>New Window</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem>Option 1</DropdownMenuItem>
									<DropdownMenuItem>Option 2</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Avatar"
				description="Avatar component for user profile images"
				code={`import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

<Avatar>
  <AvatarFallback>AB</AvatarFallback>
</Avatar>`}
			>
				<div className="flex items-center gap-4">
					<Avatar>
						<AvatarImage src="https://github.com/shadcn.png" alt="User" />
						<AvatarFallback>CN</AvatarFallback>
					</Avatar>
					<Avatar>
						<AvatarFallback>JD</AvatarFallback>
					</Avatar>
					<Avatar className="h-12 w-12">
						<AvatarFallback>AB</AvatarFallback>
					</Avatar>
					<Avatar className="h-16 w-16">
						<AvatarFallback>XL</AvatarFallback>
					</Avatar>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Separator"
				description="Separator component for dividing content"
				code={`import { Separator } from "@/components/ui/separator";

<div>
  <div>Content above</div>
  <Separator />
  <div>Content below</div>
</div>

<div className="flex">
  <div>Left</div>
  <Separator orientation="vertical" />
  <div>Right</div>
</div>`}
			>
				<div className="space-y-4">
					<div>
						<p className="text-sm">Content above separator</p>
						<Separator className="my-4" />
						<p className="text-sm">Content below separator</p>
					</div>
					<div className="flex items-center gap-4 h-8">
						<span className="text-sm">Left content</span>
						<Separator orientation="vertical" />
						<span className="text-sm">Right content</span>
					</div>
				</div>
			</ComponentSection>

			<ComponentSection
				title="Skeleton"
				description="Skeleton component for loading states"
				code={`import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-[125px] w-full rounded-xl" />`}
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-[250px]" />
						<Skeleton className="h-4 w-[200px]" />
					</div>
					<Skeleton className="h-[125px] w-full rounded-xl" />
					<div className="flex items-center space-x-4">
						<Skeleton className="h-12 w-12 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-[250px]" />
							<Skeleton className="h-4 w-[200px]" />
						</div>
					</div>
				</div>
			</ComponentSection>
		</div>
	);
}


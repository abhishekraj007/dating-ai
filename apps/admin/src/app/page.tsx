"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Shield,
  Code,
  Rocket,
  Check,
  ArrowRight,
  Star,
  Smartphone,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Web & Mobile",
      description:
        "One codebase, two platforms. Build for web with Next.js and native mobile apps with Expo React Native.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description:
        "Built with Next.js 15 and Convex for optimal performance and real-time data synchronization.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure by Default",
      description:
        "Enterprise-grade authentication with Better Auth and secure payment processing via Polar.",
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Native Mobile",
      description:
        "iOS and Android apps with Expo, RevenueCat for in-app purchases, and shared backend logic.",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Developer Friendly",
      description:
        "TypeScript-first with shadcn/ui for web and NativeWind for mobile, ready to customize.",
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Production Ready",
      description:
        "Complete subscription management, credit system, and payment webhooks out of the box.",
    },
  ];

  const benefits = [
    "Full-stack TypeScript with Next.js 15",
    "Native mobile apps with Expo & React Native",
    "Real-time database with Convex",
    "Authentication with Better Auth",
    "Web payments with Polar",
    "Mobile payments with RevenueCat",
    "Credit/token system included",
    "Shared backend logic across platforms",
    "NativeWind styling for mobile",
    "Responsive web design with shadcn/ui",
    "Dark mode support everywhere",
    "SEO optimized web pages",
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium">
              Launch your SaaS in days, not months
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl">
            The Complete SaaS Starter Kit
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            Everything you need to build and launch your next SaaS product.
            Authentication, payments, subscriptions, and more – all
            pre-configured and ready to deploy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => router.push("/auth")}>
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/pricing")}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with modern technologies and best practices to help you ship
            faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cross-Platform Section */}
      <section className="container mx-auto px-4 py-20 border-t bg-muted/30">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cross-Platform</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              One Backend, Multiple Platforms
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Build your web app with Next.js and native mobile apps with Expo,
              all powered by the same Convex backend. Share business logic,
              authentication, and data across all platforms seamlessly.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Web with Next.js 15</h4>
                  <p className="text-sm text-muted-foreground">
                    Server-side rendering, API routes, and shadcn/ui components
                    for a beautiful web experience.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Mobile with Expo</h4>
                  <p className="text-sm text-muted-foreground">
                    Native iOS and Android apps using React Native, Expo Router,
                    and NativeWind for styling.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-8">
            <h3 className="font-semibold text-xl mb-6">Tech Stack</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-primary">Web</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Next.js 15",
                    "shadcn/ui",
                    "Tailwind CSS",
                    "Polar Payments",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-xs rounded-full bg-primary/10 border border-primary/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-primary">Mobile</h4>
                <div className="flex flex-wrap gap-2">
                  {["Expo", "React Native", "NativeWind", "RevenueCat"].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs rounded-full bg-primary/10 border border-primary/20"
                      >
                        {tech}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-primary">Backend</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Convex",
                    "Better Auth",
                    "TypeScript",
                    "Real-time Sync",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-xs rounded-full bg-primary/10 border border-primary/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Modern SaaS
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Skip the boilerplate and focus on building your unique features.
              Our starter kit includes everything you need to launch a
              production-ready SaaS application.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Explore Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Your SaaS?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join developers who are shipping faster with our production-ready
            starter kit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/auth")}>
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/components")}
            >
              View Components
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 SaaS Starter. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground transition">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-foreground transition"
            >
              Dashboard
            </Link>
            <Link href="/todos" className="hover:text-foreground transition">
              Todos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

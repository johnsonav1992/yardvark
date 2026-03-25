import { DOCUMENT } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@auth0/auth0-angular";
import { Button } from "primeng/button";
import { VarkyLogoComponent } from "../../components/miscellanious/varky-logo/varky-logo.component";

interface LandingFeature {
	icon: string;
	title: string;
	description: string;
}

interface LandingProFeature {
	icon: string;
	title: string;
	description: string;
}

interface LandingScreenshot {
	src: string;
	alt: string;
}

interface LandingPricingPlan {
	name: string;
	price: string;
	period: string;
	features: string[];
	popular?: boolean;
	savings?: string;
	outlined: boolean;
	ctaLabel: string;
}

const PRO_FEATURES: string[] = [
	"Unlimited entries",
	"AI Assistant & Insights",
	"Lawn Health Score",
	"Advanced analytics",
	"GDD tracking",
	"Priority support",
];

@Component({
	selector: "landing-page",
	standalone: true,
	imports: [Button, RouterLink, VarkyLogoComponent],
	templateUrl: "./landing-page.component.html",
	styleUrl: "./landing-page.component.scss",
})
export class LandingPageComponent {
	private _auth = inject(AuthService);
	private _document = inject(DOCUMENT);

	public currentYear = new Date().getFullYear();

	public readonly features: LandingFeature[] = [
		{
			icon: "ti ti-clipboard-list",
			title: "Entry Log",
			description:
				"Log every lawn care session: mowing, fertilizing, aerating, seeding, and more. Attach photos, notes, products, and lawn segments to build a complete history over time.",
		},
		{
			icon: "ti ti-layout-dashboard",
			title: "Dashboard",
			description:
				"See what matters most at a glance. Drag-to-reorder widgets show days since last mow, soil temperature, GDD progress, lawn season progress, live weather, and recent entries.",
		},
		{
			icon: "ti ti-sun",
			title: "GDD Tracking",
			description:
				"Track Growing Degree Days accumulation throughout the season to help you time lawn care activities with more precision.",
		},
		{
			icon: "ti ti-chart-line",
			title: "Soil Data",
			description:
				"Log and visualize soil temperature trends over time to better understand what's happening beneath the surface.",
		},
		{
			icon: "ti ti-package",
			title: "Products & Equipment",
			description:
				"Manage your product inventory and equipment in one place. Track maintenance history so nothing gets missed.",
		},
		{
			icon: "ti ti-calculator",
			title: "Calculators",
			description:
				"Built-in fertilizer rate and irrigation runtime calculators so you always apply the right amount.",
		},
	];

	public readonly proFeatures: LandingProFeature[] = [
		{
			icon: "ti ti-message-chatbot",
			title: "Varky - AI Assistant",
			description:
				"Your lawn has a history. Varky knows it. Let your AI assistant review past sessions and help you log new ones, so keeping up with your lawn feels effortless.",
		},
		{
			icon: "ti ti-heart-rate-monitor",
			title: "Lawn Health Score",
			description:
				"Stop guessing how your lawn is doing. Get an AI-generated score with a personalized assessment of your care routine, so you always know what's working and what needs attention.",
		},
	];

	public readonly desktopScreenshots: LandingScreenshot[] = [
		{ src: "/screenshots/desktop-2.png", alt: "Entry log view" },
		{ src: "/screenshots/desktop-3.png", alt: "Analytics view" },
	];

	public readonly mobileScreenshots: LandingScreenshot[] = [
		{ src: "/screenshots/mobile-1.png", alt: "Mobile dashboard" },
		{ src: "/screenshots/mobile-2.png", alt: "Mobile entry log" },
		{ src: "/screenshots/mobile-3.png", alt: "Mobile analytics" },
	];

	public readonly pricingPlans: LandingPricingPlan[] = [
		{
			name: "Free",
			price: "$0",
			period: "/ month",
			features: [
				"6 entries per month",
				"Dashboard & widgets",
				"GDD tracking",
				"Soil data logging",
				"Products & equipment",
				"Calculators",
			],
			outlined: true,
			ctaLabel: "Start Tracking",
		},
		{
			name: "Yearly",
			price: "$60",
			period: "/ year",
			savings: "Save $24/year",
			features: PRO_FEATURES,
			popular: true,
			outlined: false,
			ctaLabel: "Get Started",
		},
		{
			name: "Monthly",
			price: "$7",
			period: "/ month",
			features: PRO_FEATURES,
			outlined: true,
			ctaLabel: "Get Started",
		},
	];

	public signIn(): void {
		this._auth.loginWithRedirect();
	}

	public signUp(): void {
		this._auth.loginWithRedirect({
			authorizationParams: { screen_hint: "signup" },
		});
	}

	public scrollTo(id: string): void {
		this._document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	}
}

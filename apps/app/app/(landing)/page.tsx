import type { Metadata } from "next";
import { AgentSection } from "@/components/landing/agent-section";
import { LandingAnalytics } from "@/components/landing/analytics";
import { CapabilitiesSection } from "@/components/landing/capabilities-section";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { ProductShot } from "@/components/landing/product-shot/product-shot";

export const metadata: Metadata = {
	title: "CRM IA — Tu equipo comercial que trabaja solo",
	description: "CRM inteligente para gestionar contactos, empresas, oportunidades y seguimientos con agentes de IA.",
};

export default function Home() {
	return (
		<div className="dark flex min-h-svh w-full flex-col items-center overflow-clip bg-background font-sans text-foreground">
			<LandingNav />
			<Hero />
			<ProductShot />
			<AgentSection />
			<CapabilitiesSection />
			<ClosingCta />
			<LandingFooter />
			<LandingAnalytics />
		</div>
	);
}

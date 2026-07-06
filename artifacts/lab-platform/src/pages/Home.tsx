import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Microscope, Activity, ShieldCheck, BarChart3, ArrowRight, Zap, Users, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#050d1a", color: "#fff" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(5,13,26,0.85)", backdropFilter: "blur(16px)" }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              <Microscope className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">LabRes</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <button className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}>
                Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-5 py-2 text-sm font-semibold rounded-lg transition-all" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 30px rgba(37,99,235,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(37,99,235,0.4)")}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "90vh", display: "flex", alignItems: "center" }}>
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.25) 0%, transparent 70%)" }} />
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="container mx-auto px-6 py-24 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-sm font-medium" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.4)", color: "#60a5fa" }}>
            <Zap className="h-3.5 w-3.5" />
            Built for research institutions
          </div>

          <h1 className="font-black tracking-tight mb-6 mx-auto" style={{ fontSize: "clamp(2.8rem,6vw,5rem)", lineHeight: 1.1, maxWidth: "880px", background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Precision Resource<br />Intelligence
          </h1>

          <p className="mx-auto mb-10 text-lg leading-relaxed" style={{ maxWidth: "600px", color: "rgba(255,255,255,0.55)" }}>
            Centralized command center for research institutions. Schedule shared equipment, monitor real-time utilization, and drive data-driven procurement — all in one platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all" style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", boxShadow: "0 0 30px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                Deploy Platform <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
                Sign In
              </button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex flex-wrap justify-center gap-8">
            {[
              { value: "94%", label: "Avg utilization improvement" },
              { value: "3.2×", label: "Faster equipment booking" },
              { value: "60%", label: "Reduction in idle time" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black" style={{ color: "#60a5fa" }}>{stat.value}</div>
                <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-24 relative" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3 text-white">Everything your lab needs</h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.45)" }}>Purpose-built tools for research infrastructure management</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Activity,
                title: "Real-time Utilization",
                desc: "Monitor equipment usage continuously. Identify bottlenecks, idle assets, and optimize lab capacity with live heatmaps.",
                accent: "#2563eb",
              },
              {
                icon: ShieldCheck,
                title: "Access Control",
                desc: "Role-based scheduling and authorization. Ensure only trained personnel operate sensitive instruments.",
                accent: "#7c3aed",
              },
              {
                icon: BarChart3,
                title: "Procurement Analytics",
                desc: "Data-driven capital expenditure decisions. Justify new purchases with hard utilization metrics and cost reports.",
                accent: "#0891b2",
              },
              {
                icon: Globe,
                title: "Inter-Institution Sharing",
                desc: "Share expensive equipment across partner institutions. Maximize ROI on capital-intensive research assets.",
                accent: "#059669",
              },
            ].map(feature => (
              <div key={feature.title} className="rounded-2xl p-6 transition-all group" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-5" style={{ background: `${feature.accent}20`, border: `1px solid ${feature.accent}40` }}>
                  <feature.icon className="h-5 w-5" style={{ color: feature.accent }} />
                </div>
                <h3 className="text-base font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="w-full py-20">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #1e40af 100%)", boxShadow: "0 0 60px rgba(37,99,235,0.3)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-3">Ready to optimize your lab?</h2>
              <p className="text-blue-200 mb-8 text-base">Join research institutions already running on LabRes.</p>
              <Link href="/sign-up">
                <button className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all" style={{ background: "#fff", color: "#1d4ed8", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  Get started for free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "#1d4ed8" }}>
              <Microscope className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">LabRes</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            Built for modern research institutions. Rigorous, data-dense, and trustworthy.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * That makes it cheap to serve and safe for logged-out / crawler traffic.
 *
 * Need live data or auth here? Move this file to src/pages/(app)/index.tsx
 * and it becomes a dynamic page. Conversely, any page you want to keep static
 * (marketing, docs, legal) belongs at this top level.
 *
 * Top-level pages are also prerendered to static HTML at build
 * (prerender.ts, via vite.config.ts) so crawlers read real content.
 * Keep them renderable without a browser: no window/document during render,
 * prose in HTML text, reveal animations in CSS keyframes rather than JS-driven
 * initial states. `<Seo>` comes first and reads src/seo.ts.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, Aperture, BarChart3, Image, Sparkles } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <main className="min-h-screen overflow-hidden bg-[#090a0c] text-white" data-testid="static-landing">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-white text-black">
              <Aperture className="size-5" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">PhotoPulse</span>
          </div>
          <Link to="/home" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
            Open studio
          </Link>
        </nav>

        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1fr_520px] lg:pt-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
              <Sparkles className="size-3.5 text-[#a3ff12]" />
              CNN-powered photo intelligence
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
              Know before you post.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-7 text-white/55">
              Upload a photo and PhotoPulse predicts its social potential—lighting, composition, subject clarity, and scroll-stopping impact.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/home" className="group inline-flex items-center gap-2 rounded-full bg-[#a3ff12] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#b5ff3d]">
                Grade a photo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-sm text-white/35">Free preview • No account needed</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-12 rounded-full bg-[#a3ff12]/10 blur-[80px]" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111317] p-3 shadow-2xl">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_70%_20%,#b5c4ac_0%,#5d6b56_18%,#242923_48%,#10120f_100%)]">
                <div className="absolute inset-x-[14%] bottom-0 h-[74%] rounded-t-full bg-black/20 backdrop-blur-[2px]" />
                <div className="absolute left-1/2 top-[18%] size-28 -translate-x-1/2 rounded-full border border-white/15 bg-black/15" />
                <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Social potential</p>
                    <p className="mt-1 text-5xl font-semibold tracking-tight">91</p>
                  </div>
                  <div className="rounded-full bg-[#a3ff12] px-3 py-1.5 text-xs font-bold text-black">Excellent</div>
                </div>
              </div>
            </div>

            <div className="absolute -left-5 top-20 hidden w-44 rounded-2xl border border-white/10 bg-[#17191d]/95 p-4 shadow-xl sm:block">
              <div className="flex items-center gap-2 text-xs text-white/55"><Image className="size-3.5" /> Composition</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[88%] rounded-full bg-[#a3ff12]" /></div>
              <p className="mt-2 text-sm font-semibold">Strong focal point</p>
            </div>
            <div className="absolute -right-3 bottom-20 hidden w-40 rounded-2xl border border-white/10 bg-[#17191d]/95 p-4 shadow-xl sm:block">
              <div className="flex items-center gap-2 text-xs text-white/55"><BarChart3 className="size-3.5" /> Scan complete</div>
              <p className="mt-2 text-sm font-semibold">1,000+ visual signals</p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

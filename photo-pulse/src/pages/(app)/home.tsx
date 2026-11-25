/**
 * Placeholder home page — replace this with the app's real home.
 *
 * This is intentionally unstyled scaffolding, not a design to build on.
 * Design the app's own look (layout, theme tokens, typography) from your
 * product's point of view instead of extending this page.
 */

import { useAuthProfileReady, useMutations } from 'deepspace'
import { APP_NAME } from '../../constants'
import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import * as mobilenet from '@tensorflow-models/mobilenet'
import '@tensorflow/tfjs'
import { Aperture, ArrowLeft, Upload, ScanLine, Sun, Contrast, Focus, Palette, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

type Analysis = {
  score: number
  label: string
  confidence: number
  topLabel: string
  brightness: number
  contrast: number
  saturation: number
  edgeDensity: number
  desiredAdjectives: string
}

function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, n)) }

function analyzePixels(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { brightness: 50, contrast: 50, saturation: 50, edgeDensity: 50 }
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let lumSum = 0, lumSq = 0, satSum = 0, edgeTotal = 0
  const lums = new Float32Array(width * height)
  let p = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    lums[p++] = lum
    lumSum += lum
    lumSq += lum * lum
    satSum += max === 0 ? 0 : (max - min) / max
  }
  const count = width * height
  const mean = lumSum / count
  const contrast = Math.sqrt(Math.max(0, lumSq / count - mean * mean))
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const gx = lums[i + 1] - lums[i - 1]
      const gy = lums[i + width] - lums[i - width]
      edgeTotal += Math.sqrt(gx * gx + gy * gy)
    }
  }
  return {
    brightness: clamp(mean * 100),
    contrast: clamp(contrast * 310),
    saturation: clamp((satSum / count) * 125),
    edgeDensity: clamp((edgeTotal / ((width - 2) * (height - 2))) * 260),
  }
}

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null)
  const [loadingModel, setLoadingModel] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [dragging, setDragging] = useState(false)
  const [adjectiveInput, setAdjectiveInput] = useState('')
  const [recordId, setRecordId] = useState<string | null>(null)
  const { ready, createConfirmed, putConfirmed } = useMutations<Analysis>('photo-analyses')
  const imageRef = useRef<HTMLImageElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    mobilenet.load({ version: 2, alpha: 1.0 }).then((loaded) => {
      setModel(loaded)
      setLoadingModel(false)
    }).catch(() => setLoadingModel(false))
  }, [])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function analyze(file: File) {
    if (!file.type.startsWith('image/')) return
    setFileName(file.name)
    setAnalysis(null)
    setAnalyzing(true)
    const url = URL.createObjectURL(file)
    setPreview(url)

    const img = new Image()
    img.onload = async () => {
      imageRef.current = img
      const canvas = document.createElement('canvas')
      canvas.width = 224
      canvas.height = 224
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, 224, 224)

      const pixels = analyzePixels(canvas)
      let topLabel = 'Visual story'
      let confidence = 0.72
      if (model) {
        try {
          const predictions = await model.classify(img, 3)
          topLabel = predictions[0].className.split(',')[0]
          confidence = predictions[0].probability
        } catch { /* Heuristic analysis remains available */ }
      }

      const exposure = 100 - Math.abs(pixels.brightness - 58) * 1.15
      const clarity = 35 + pixels.contrast * 0.35 + pixels.edgeDensity * 0.22
      const color = 45 + pixels.saturation * 0.42
      const subject = 48 + confidence * 42
      const score = Math.round(clamp(exposure * 0.23 + clarity * 0.27 + color * 0.18 + subject * 0.32))
      const label = score >= 88 ? 'Exceptional' : score >= 78 ? 'Excellent' : score >= 68 ? 'Strong' : score >= 58 ? 'Promising' : 'Needs work'
      const result: Analysis = { score, label, confidence, topLabel, ...pixels, desiredAdjectives: adjectiveInput.trim() }
      setAnalysis(result)
      if (isSignedIn && ready) {
        void createConfirmed({
          fileName,
          score: result.score,
          label: result.label,
          topLabel: result.topLabel,
          confidence: result.confidence,
          brightness: result.brightness,
          contrast: result.contrast,
          saturation: result.saturation,
          edgeDensity: result.edgeDensity,
          desiredAdjectives: result.desiredAdjectives,
        }).then(setRecordId).catch(() => {})
      }
      setAnalyzing(false)
    }
    img.src = url
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void analyze(file)
  }

  async function updateAdjectives(value: string) {
    setAdjectiveInput(value)
    if (analysis && recordId && ready) {
      setAnalysis({ ...analysis, desiredAdjectives: value.trim() })
      await putConfirmed(recordId, { desiredAdjectives: value.trim() })
    }
  }

  const metrics = analysis ? [
    { icon: Focus, label: 'Subject clarity', value: clamp(48 + analysis.confidence * 42), detail: analysis.topLabel },
    { icon: Sun, label: 'Lighting', value: clamp(100 - Math.abs(analysis.brightness - 58) * 1.15), detail: analysis.brightness > 68 ? 'Bright' : analysis.brightness < 38 ? 'Low light' : 'Balanced' },
    { icon: Contrast, label: 'Composition', value: clamp(35 + analysis.contrast * 0.35 + analysis.edgeDensity * 0.22), detail: analysis.edgeDensity > 55 ? 'Defined' : 'Soft' },
    { icon: Palette, label: 'Color energy', value: clamp(45 + analysis.saturation * 0.42), detail: analysis.saturation > 55 ? 'Vivid' : 'Muted' },
  ] : []

  const desiredAdjectives = adjectiveInput.split(',').map((item) => item.trim()).filter(Boolean)

  const adjectiveOptions = ['Bold', 'Minimal', 'Warm', 'Vibrant', 'Calm', 'Luxury', 'Candid', 'Moody']

  function toneRecommendation(adjective: string) {
    const word = adjective.toLowerCase()
    if (word.includes('bold') || word.includes('dramatic')) {
      return `For “${adjective}”: keep the subject large, strengthen contrast, and place the focal point just off center. Avoid hazy blacks and low-detail shadows.`
    }
    if (word.includes('lux') || word.includes('premium') || word.includes('elegant')) {
      return `For “${adjective}”: simplify the background, create clean specular highlights, keep skin tones natural, and leave intentional negative space.`
    }
    if (word.includes('vibrant') || word.includes('play') || word.includes('fun')) {
      return `For “${adjective}”: lift midtone color saturation, use a dynamic crop, and let one bright accent lead the frame instead of covering it evenly.`
    }
    if (word.includes('calm') || word.includes('serene') || word.includes('soft')) {
      return `For “${adjective}”: reduce visual clutter, soften hard contrast slightly, and align the subject with a quiet area of the frame.`
    }
    if (word.includes('candid') || word.includes('natural') || word.includes('authentic')) {
      return `For “${adjective}”: preserve natural skin or environment tones, favor a looser crop, and avoid overly polished or perfectly symmetric framing.`
    }
    if (word.includes('warm')) {
      return `For “${adjective}”: use warm but controlled highlights, retain clean shadow detail, and avoid pushing skin tones or neutral areas orange.`
    }
    if (word.includes('dark') || word.includes('moody')) {
      return `For “${adjective}”: deepen the shadows, preserve a narrow highlight range, and give the subject a clear rim or edge light.`
    }
    if (word.includes('minimal') || word.includes('clean')) {
      return `For “${adjective}”: remove one or two background elements, reduce the subject count, and keep the frame balanced around negative space.`
    }
    return `For “${adjective}”: use the weakest metric below as the first edit, then adjust crop and color so every change reinforces that tone.`
  }

  function nextBestMove() {
    if (!analysis) return ''
    const weakest = [
      { name: 'lighting', value: 100 - Math.abs(analysis.brightness - 58) * 1.15, action: analysis.brightness < 38 ? 'open the shadows and lift exposure' : analysis.brightness > 68 ? 'reduce highlights and rebalance exposure' : 'fine-tune the light on the main subject' },
      { name: 'composition', value: 35 + analysis.contrast * 0.35 + analysis.edgeDensity * 0.22, action: 'tighten the crop around the subject and remove distracting edge detail' },
      { name: 'color', value: 45 + analysis.saturation * 0.42, action: analysis.saturation > 55 ? 'control one or two oversaturated areas' : 'add restrained color separation around the focal point' },
      { name: 'subject clarity', value: 48 + analysis.confidence * 42, action: 'bring the subject forward with sharper focus and a simpler background' },
    ].sort((a, b) => a.value - b.value)[0]

    if (analysis.score >= 88) return `Keep this exceptionally strong frame. For the biggest finish, ${weakest.action}; this protects the score while sharpening ${weakest.name}.`
    if (analysis.score >= 78) return `This is already scroll-ready. Make one controlled edit: ${weakest.action}. Avoid extra effects that could weaken ${weakest.name}.`
    if (analysis.score >= 68) return `The image has momentum, but the score is capped by ${weakest.name}. ${weakest.action}, then try a 10–15% tighter crop before posting.`
    if (analysis.score >= 58) return `This needs a purposeful second pass. Start with ${weakest.name}: ${weakest.action}. Reduce background distraction before changing the whole image.`
    return `At ${analysis.score}/100, rebuild the visual hierarchy first. ${weakest.action}; simplify the background or recapture the shot if the subject remains unclear.`
  }

  const adjectiveAdvice = desiredAdjectives.map(toneRecommendation).join(' ')

  return (
    <main className="min-h-full bg-[#090a0c] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/[0.07] pb-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-white text-black"><Aperture className="size-5" /></div>
            <span className="font-semibold tracking-tight">PhotoPulse</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft className="size-4" /> Back</Link>
        </header>

        <section className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
          <div>
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a3ff12]">Photo studio</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Social impact scanner</h1>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[24px] border transition ${dragging ? 'border-[#a3ff12] bg-[#a3ff12]/5' : 'border-white/10 bg-[#111317]'}`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Selected photo preview" className="absolute inset-0 size-full object-contain" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-14">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{fileName}</p><p className="text-xs text-white/45">CNN visual scan</p></div>
                    <button onClick={() => inputRef.current?.click()} className="shrink-0 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs backdrop-blur">Replace</button>
                  </div>
                </>
              ) : (
                <button onClick={() => inputRef.current?.click()} className="flex max-w-sm flex-col items-center px-8 text-center">
                  <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]"><Upload className="size-6 text-[#a3ff12]" /></div>
                  <p className="mt-5 text-lg font-semibold">Drop a photo here</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">or click to browse<br />JPG, PNG, or WebP</p>
                </button>
              )}
              {analyzing && (
                <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#17191d] px-5 py-3 text-sm"><LoaderCircle className="size-4 animate-spin text-[#a3ff12]" /> Scanning visual signals…</div></div>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && void analyze(e.target.files[0])} />
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-[#111317] p-5">
            {!analysis ? (
              <div className="flex h-full min-h-[430px] flex-col items-center justify-center text-center">
                <div className="relative grid size-32 place-items-center rounded-full border border-white/10"><ScanLine className="size-8 text-white/25" /><div className="absolute inset-3 rounded-full border border-dashed border-white/10" /></div>
                <p className="mt-5 text-sm font-medium text-white/65">Waiting for an image</p>
                <p className="mt-2 max-w-[240px] text-xs leading-5 text-white/35">Upload a photo to reveal its score and improvement signals.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div><p className="text-xs uppercase tracking-[0.16em] text-white/40">Social potential</p><p className="mt-1 text-sm font-medium text-[#a3ff12]">{analysis.label}</p></div>
                  <div className="text-right"><span className="text-5xl font-semibold tracking-[-0.06em]">{analysis.score}</span><span className="text-sm text-white/30">/100</span></div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#a3ff12] transition-all duration-700" style={{ width: `${analysis.score}%` }} /></div>

                <div className="mt-7 space-y-5">
                  {metrics.map(({ icon: Icon, label, value, detail }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-white/65"><Icon className="size-4" /> {label}</div><span className="text-xs text-white/35">{detail}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-white/70" style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-2xl border border-[#a3ff12]/15 bg-[#a3ff12]/[0.05] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4 text-[#a3ff12]" /> Next best move</div>
                  <p className="mt-2 text-xs leading-5 text-white/65">{nextBestMove()}</p>
                </div>

                {desiredAdjectives.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-medium text-white/60">Tone-specific direction</p>
                    <p className="mt-2 text-xs leading-5 text-[#a3ff12]">{adjectiveAdvice}</p>
                  </div>
                )}

                <button onClick={() => inputRef.current?.click()} className="mt-4 w-full rounded-full border border-white/10 py-3 text-sm font-medium transition hover:bg-white/[0.04]">Analyze another photo</button>

                <div className="mt-4 max-w-xl">
                  <label className="mb-2 block text-xs font-medium text-white/55">How should this post feel?</label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {adjectiveOptions.map((adjective) => {
                      const selected = desiredAdjectives.some((item) => item.toLowerCase() === adjective.toLowerCase())
                      return (
                        <button
                          key={adjective}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? desiredAdjectives.filter((item) => item.toLowerCase() !== adjective.toLowerCase())
                              : [...desiredAdjectives, adjective]
                            void updateAdjectives(next.join(', '))
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${selected ? 'border-[#a3ff12] bg-[#a3ff12] text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'}`}
                        >
                          {adjective}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    id="desired-adjectives"
                    value={adjectiveInput}
                    onChange={(event) => void updateAdjectives(event.target.value)}
                    placeholder="Or add your own, e.g. fearless, intimate"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#a3ff12]/50"
                  />
                </div>
              </div>
            )}
          </aside>
        </section>

        <div className="pb-3 text-center text-[11px] text-white/25">
          {loadingModel ? 'Loading CNN…' : 'CNN ready'} · Results are a creative preview, not a guarantee of engagement
        </div>
      </div>
    </main>
  )
}

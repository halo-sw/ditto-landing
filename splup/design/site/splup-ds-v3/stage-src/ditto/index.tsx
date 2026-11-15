import { useEffect } from 'react'
import { Stage } from '../kit/stage'
import { Phone } from '../kit/phone'
import { Expand } from '../kit/motion/Expand'
import { Bar } from '../kit/window'
import { Icon } from '../kit/parts/Icon'
import { States } from '../kit/motion/States'
import { Toast } from '../kit/parts/Toast'
import type { Act } from '../kit/act'
import photo from './picnic.webp'
import sora from './sora.webp'
import './ditto.css'

// Ditto!'s design guide hero, phone only (copied from the phone-touch gold).
// Story in three beats: Sora's platter (context), a tap on her photo widget
// opens it into its detail the way iOS cards open (action), then the Ditto
// button is held for three seconds and the widget is kept (result). It loops
// by being put back: close, and the card folds back into the platter.
//
// The app's button (DittoHoldButton.swift): held, three colors of its own family
// fill it from the leading edge over three seconds; then it asks, and a toast
// says the widget was kept while the button goes back to rest.
//
// Real strings: 소라, @soramaybe, 간식 부자, and the button's four labels.
// Everything else is a line or a shape.

type Phase = 'idle' | 'holding' | 'pending' | 'complete'
type S = { open: boolean; phase: Phase }

const START: S = { open: false, phase: 'idle' }

// The card has equal screen-point gutters; Expand measures the current Phone.
const CARD = { x: 16, h: 132 }
const TOPS = [134, 276, 418, 560]
const PICK = 1
const REST = { x: 200, y: 300 }
const HEADER = 300
const HOLD_MS = 3000

const script = async (a: Act<S>) => {
  await a.wait(1100)
  a.mark('tap')
  await a.click('card')
  a.put({ open: true })
  await a.wait(1400)
  a.mark('hold')
  await a.move({ at: 'hold', x: 0.5, y: 0.5 })
  a.put({ phase: 'holding' })
  // A press that stays down: the finger barely travels for three seconds
  await a.drag({ at: 'hold', x: 0.52, y: 0.5 }, undefined, { duration: HOLD_MS })
  a.put({ phase: 'pending' })
  await a.wait(650)
  a.mark('done')
  a.put({ phase: 'complete' })
  await a.wait(2000)
  a.mark('close')
  await a.click('close')
  a.put({ open: false })
  await a.wait(900)
  // Hidden behind the card's clip now: reset the button unseen
  await a.snap({ phase: 'idle' })
  // The finger lifts away; the touch style shows nothing between taps
  await a.move(REST)
  await a.wait(300)
}

// The host page follows the demo's state (its step list lights up with it)
function Tell({ at }: { at: string }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('splup-ditto-demo', { detail: at }))
  }, [at])
  return null
}

function Mark() {
  return (
    <svg viewBox="0 0 214 214" width="22" height="22" aria-hidden>
      <path fill="currentColor" d="M176.502 20.1889C176.502 20.1889 151.492 0.354846 97.6641 0C94.3642 19.1617 88.339 51.3127 81.3034 89.5053C79.088 54.665 59.1585 48.6326 48.2761 50.8924C21.3295 56.5046 -9.02822 106.398 2.52162 142.172C14.1642 178.236 66.5 169.869 87.9867 165.452C87.9497 165.34 87.9219 165.228 87.8848 165.125C87.4862 128.819 92.0468 78.7012 124.629 47.6988C139.08 33.9532 161.782 21.2254 176.511 20.1982L176.502 20.1889ZM67.0839 146.169C62.5604 151.146 52.4473 144.413 43.4095 132.572C24.8334 108.209 25.7047 80.905 39.1641 80.7369C46.45 80.6435 53.6153 86.1997 61.2256 109.106C65.7121 122.618 69.7906 143.181 67.0747 146.169H67.0839Z" />
      <path fill="currentColor" d="M153.996 156.046C151.332 158.734 147.415 158.93 145.465 153.751C144.379 150.849 141.687 144.093 134.633 134.976C130.845 130.077 123.716 122.659 119.186 114.046C114.332 104.817 113.375 99.5919 114.146 91.7629C115.158 81.6385 125.257 69.1251 139.33 69.993C164.012 71.514 162.165 103.922 162.165 103.922C162.165 103.922 176.803 73.0536 200.279 83.1595C213.209 88.7303 215.892 105.275 212.875 114.046C206.953 131.253 185 138.009 176.608 142.068C163.965 148.171 160.494 149.496 153.987 156.046H153.996Z" />
      <circle fill="currentColor" cx="141.594" cy="187.204" r="16.75" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path d="M3.4 8.4l3 3 6.2-6.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// The platter's other widgets: art and lines, no words
const ROWS: Record<number, [string, string]> = {
  0: ['dd-tile--disc', 'dd-tile--memo'],
  2: ['dd-tile--memo', 'dd-tile--rose'],
  3: ['dd-tile--sky', 'dd-tile--memo'],
}

export default function DittoHold() {
  return (
    <Stage<S>
      width={400}
      height={520}
      compact={{ below: 400, width: 358, height: 520 }}
      initial={START}
      poster={{ open: true, phase: 'complete' }}
      script={script}
      cursor={{ at: REST, style: 'touch' }}
      className="dd"
    >
      {(s, rect, layout) => {
        const top = TOPS[PICK]
        return (
          <>
            <Tell at={s.open ? s.phase : 'closed'} />
            <Phone width={layout === 'compact' ? 326 : 300} className="dd-phone" data-open={s.open || undefined}>
              <div className="dd-list" data-back={s.open || undefined}>
                <header className="dd-handle">
                  <img className="dd-handle__av" src={sora} alt="" />
                  <span className="dd-handle__id">
                    <span className="dd-handle__name">소라</span>
                    <span className="dd-handle__at">@soramaybe</span>
                  </span>
                </header>
                {TOPS.map((y, i) =>
                  i === PICK ? (
                    <span key={i} className="dd-slot" data-target="card" style={{ top: y }} />
                  ) : (
                    <div key={i} className="dd-row" data-flip={i === 2 || undefined} style={{ top: y }}>
                      {ROWS[i].map((kind, k) => (
                        <span key={k} className={`dd-tile ${kind}`}>
                          {kind === 'dd-tile--memo' ? (
                            <>
                              <Bar w="72%" h={8} r={4} tone={4} />
                              <Bar w="88%" h={7} r={3} tone={2} />
                              <Bar w="54%" h={7} r={3} tone={2} />
                            </>
                          ) : kind === 'dd-tile--disc' ? (
                            <span className="dd-disc" />
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ),
                )}
                <nav className="dd-tabs">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="dd-tab" data-on={i === 0 || undefined}>
                      <span className="dd-tab__icon" />
                      <span className="dd-tab__label" />
                    </span>
                  ))}
                </nav>
              </div>

              {/* The picked widget and its detail are one element */}
              <div className="dd-press" style={{ transformOrigin: `50% ${top + CARD.h / 2}px` }}>
                <Expand className="dd-detail" open={s.open} from={rect('card')} radius={22} duration={620}>
                  <div className="dd-detail__inner" style={{ transform: `translateY(${s.open ? 0 : CARD.h - HEADER}px)` }}>
                    <div
                      className="dd-hero"
                      style={{
                        backgroundImage: `url(${photo})`,
                        clipPath: s.open ? 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)' : `inset(0px ${CARD.x}px 0px ${CARD.x}px round 0px 0px 22px 22px)`,
                      }}
                    >
                      <span className="dd-close" data-target="close">
                        <Icon name="close" size={14} stroke={2} />
                      </span>
                      <span className="dd-hero__text" style={{ transform: `translateX(${s.open ? 0 : CARD.x}px)` }}>
                        <span className="dd-hero__title">간식 부자</span>
                      </span>
                    </div>
                    <div className="dd-body">
                      <div className="dd-from">
                        <img className="dd-from__av" src={sora} alt="" />
                        <span className="dd-from__lines">
                          <Bar w={54} h={9} r={4} tone={5} />
                          <Bar w={96} h={7} r={3} tone={2} />
                        </span>
                      </div>
                      <span className="dd-hold" data-target="hold" data-phase={s.phase}>
                        <States
                          value={s.phase}
                          states={{
                            idle: (
                              <>
                                <Mark /> 내 플래터에 디토하기
                              </>
                            ),
                            holding: (
                              <>
                                <Mark /> 계속 누르세요
                              </>
                            ),
                            pending: (
                              <>
                                <Mark /> 가져오는 중...
                              </>
                            ),
                            complete: (
                              <>
                                <Mark /> 내 플래터에 디토하기
                              </>
                            ),
                          }}
                        />
                      </span>
                      <div className="dd-notes">
                        <Bar w={64} h={8} r={4} tone={4} />
                        {[112, 84, 126, 96, 118].map((w, i) => (
                          <span key={i} className="dd-note">
                            <span className="dd-note__dot" data-i={i} />
                            <Bar w={w} h={8} r={4} tone={3} />
                            <Bar w={26} h={8} r={4} tone={2} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Expand>
              </div>
              <div className="dd-toast">
                <Toast show={s.open && s.phase === 'complete'} icon={<Check />}>
                  내 플래터에 담았어요
                </Toast>
              </div>
            </Phone>
          </>
        )
      }}
    </Stage>
  )
}

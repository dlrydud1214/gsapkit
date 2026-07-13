import { useMemo, useState } from 'react';

type Preset = 'fadeUp' | 'scaleIn' | 'slideLeft' | 'staggerCards';
type OutputMode = 'vanilla' | 'react';

const presetLabels: Record<Preset, string> = {
  fadeUp: 'Fade Up',
  scaleIn: 'Scale In',
  slideLeft: 'Slide Left',
  staggerCards: 'Stagger Cards',
};

function App() {
  const [preset, setPreset] = useState<Preset>('fadeUp');
  const [duration, setDuration] = useState(0.8);
  const [distance, setDistance] = useState(48);
  const [stagger, setStagger] = useState(0.12);
  const [ease, setEase] = useState('power2.out');
  const [scrollTrigger, setScrollTrigger] = useState(true);
  const [outputMode, setOutputMode] = useState<OutputMode>('vanilla');
  const [copied, setCopied] = useState(false);

  const vars = useMemo(() => {
    const base = { duration, ease };
    if (preset === 'scaleIn') return { ...base, opacity: 0, scale: 0.8 };
    if (preset === 'slideLeft') return { ...base, opacity: 0, x: distance };
    if (preset === 'staggerCards') return { ...base, opacity: 0, y: distance, stagger };
    return { ...base, opacity: 0, y: distance };
  }, [preset, duration, distance, stagger, ease]);

  const animationCode = JSON.stringify(
    {
      ...vars,
      ...(scrollTrigger
        ? {
            scrollTrigger: {
              trigger: preset === 'staggerCards' ? '.card-list' : '.target',
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        : {}),
    },
    null,
    2,
  );

  const code = outputMode === 'vanilla'
    ? `import { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\n\ngsap.registerPlugin(ScrollTrigger);\n\ngsap.from('${preset === 'staggerCards' ? '.card' : '.target'}', ${animationCode});`
    : `import { useRef } from 'react';\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\nimport { useGSAP } from '@gsap/react';\n\ngsap.registerPlugin(ScrollTrigger, useGSAP);\n\nexport default function MotionSection() {\n  const scope = useRef<HTMLDivElement>(null);\n\n  useGSAP(() => {\n    gsap.from('${preset === 'staggerCards' ? '.card' : '.target'}', ${animationCode});\n  }, { scope });\n\n  return <div ref={scope}>...</div>;\n}`;

  const previewStyle = useMemo(() => {
    if (preset === 'scaleIn') return { transform: 'scale(.8)', opacity: 0 };
    if (preset === 'slideLeft') return { transform: `translateX(${distance}px)`, opacity: 0 };
    return { transform: `translateY(${distance}px)`, opacity: 0 };
  }, [preset, distance]);

  const replay = () => {
    const targets = document.querySelectorAll<HTMLElement>('.preview-target');
    targets.forEach((el, index) => {
      el.getAnimations().forEach((animation) => animation.cancel());
      Object.assign(el.style, previewStyle);
      el.animate(
        [previewStyle, { transform: 'none', opacity: 1 }],
        {
          duration: duration * 1000,
          delay: preset === 'staggerCards' ? index * stagger * 1000 : 0,
          easing: 'cubic-bezier(.22,.61,.36,1)',
          fill: 'forwards',
        },
      );
    });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Visual GSAP Builder</p>
          <h1>GSAPKit</h1>
        </div>
        <button className="primary-button" onClick={replay}>다시 재생</button>
      </header>

      <section className="builder-grid">
        <aside className="panel preset-panel">
          <h2>효과 선택</h2>
          <div className="preset-list">
            {(Object.keys(presetLabels) as Preset[]).map((key) => (
              <button
                key={key}
                className={preset === key ? 'preset active' : 'preset'}
                onClick={() => setPreset(key)}
              >
                <span>{presetLabels[key]}</span>
                <small>{key === 'staggerCards' ? '여러 요소 순차 등장' : '기본 인터랙션'}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel preview-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>{presetLabels[preset]}</h2>
            </div>
            <span className="badge">실시간</span>
          </div>
          <div className="preview-stage">
            {preset === 'staggerCards' ? (
              <div className="card-list">
                {[1, 2, 3].map((item) => <div className="preview-target preview-card" key={item}>Card {item}</div>)}
              </div>
            ) : (
              <div className="preview-target hero-card">Motion made practical.</div>
            )}
          </div>
        </section>

        <aside className="panel settings-panel">
          <h2>속성 설정</h2>
          <label>Duration <strong>{duration.toFixed(1)}s</strong>
            <input type="range" min="0.2" max="2" step="0.1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </label>
          <label>Distance <strong>{distance}px</strong>
            <input type="range" min="0" max="160" step="4" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
          </label>
          <label>Stagger <strong>{stagger.toFixed(2)}s</strong>
            <input type="range" min="0" max="0.5" step="0.01" value={stagger} onChange={(e) => setStagger(Number(e.target.value))} />
          </label>
          <label>Ease
            <select value={ease} onChange={(e) => setEase(e.target.value)}>
              <option>power2.out</option>
              <option>power3.out</option>
              <option>back.out(1.7)</option>
              <option>expo.out</option>
            </select>
          </label>
          <label className="toggle-row">
            <span>ScrollTrigger</span>
            <input type="checkbox" checked={scrollTrigger} onChange={(e) => setScrollTrigger(e.target.checked)} />
          </label>
        </aside>
      </section>

      <section className="panel code-panel">
        <div className="code-toolbar">
          <div className="tabs">
            <button className={outputMode === 'vanilla' ? 'tab active' : 'tab'} onClick={() => setOutputMode('vanilla')}>Vanilla JS</button>
            <button className={outputMode === 'react' ? 'tab active' : 'tab'} onClick={() => setOutputMode('react')}>React</button>
          </div>
          <button className="copy-button" onClick={copyCode}>{copied ? '복사됨' : '코드 복사'}</button>
        </div>
        <pre><code>{code}</code></pre>
      </section>
    </main>
  );
}

export default App;

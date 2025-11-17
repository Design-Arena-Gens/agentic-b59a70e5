'use client'

import './globals.css'
import TransformationCanvas from '../components/TransformationCanvas'

export default function Page() {
  return (
    <div className="container">
      <header className="header">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2c5.523 0 10 4.477 10 10 0 4.072-2.447 7.559-5.948 9.07C18.969 19.02 20 16.634 20 14c0-5.523-4.477-10-10-10-.836 0-1.65.101-2.427.292C8.84 2.76 10.376 2 12 2z" fill="#e6f0ff"/>
        </svg>
        <div className="title">Moon Knight Transformation</div>
      </header>

      <main className="canvasWrap">
        <div className="card">
          <span className="badge">16:9  |  720p</span>
          <TransformationCanvas />
        </div>
        <div className="controls">
          <button id="playBtn" className="primary" onClick={() => document.dispatchEvent(new CustomEvent('mk:play'))}>Play Transformation</button>
          <button id="recordBtn" className="secondary" onClick={() => document.dispatchEvent(new CustomEvent('mk:record'))}>Generate Video (WebM)</button>
          <a id="downloadLink" className="videoLink" href="#" style={{display:'none'}} download="moon-transformation.webm">Download Video</a>
        </div>
        <div className="note">Recording happens in-browser via MediaRecorder; some browsers may not support VP9/Opus.</div>
      </main>

      <footer className="footer">? {new Date().getFullYear()} Nightbound Labs</footer>
    </div>
  )
}

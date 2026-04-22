import './App.css'
import { useCallback, useState } from 'react'
import InputPanel from './components/InputPanel'
import TreeVisualizer, { type LogEntry } from './components/TreeVisualizer'

interface JSONNode {
  id: number
  tag: string
  attributes: Record<string, string>
  children?: JSONNode[]
}

interface ApiResult {
  executionTimeMs: number
  nodesVisited: number
  maxDepth: number
  tree: JSONNode
  traversalLog: LogEntry[]
}

type AnimPhase = 'idle' | 'zoom' | 'traverse' | 'done'

export default function App() {
  const [mode, setMode]             = useState<'url' | 'html'>('url')
  const [url, setUrl]               = useState('')
  const [html, setHtml]             = useState('')
  const [algorithm, setAlgorithm]   = useState<'bfs' | 'dfs'>('bfs')
  const [selector, setSelector]     = useState('')
  const [resultMode, setResultMode] = useState<'ALL' | 'TOP'>('ALL')
  const [topN, setTopN]             = useState(10)
  const [isLoading, setIsLoading]   = useState(false)
  const [apiResult, setApiResult]   = useState<ApiResult | null>(null)
  const [animPhase, setAnimPhase]   = useState<AnimPhase>('idle')

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)
    setApiResult(null)
    setAnimPhase('idle')
    try {
      const res = await fetch('http://localhost:8080/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          url:  mode === 'url'  ? url  : undefined,
          html: mode === 'html' ? html : undefined,
          algorithm,
          selector,
          resultMode,
          topN: resultMode === 'TOP' ? topN : undefined,
        }),
      })
      const result: ApiResult = await res.json()
      setApiResult(result)
      setAnimPhase('zoom')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoomDone     = useCallback(() => setAnimPhase('traverse'), [])
  const handleTraverseDone = useCallback(() => setAnimPhase('done'),     [])

  return (
    <div className="app-root">
      <header className="app-header">
        <span className="app-logo">CAUKSU</span>
        {apiResult && (
          <div className="app-stats">
            <span className="stat">{apiResult.executionTimeMs.toFixed(2)} ms</span>
            <span className="stat">{apiResult.nodesVisited} nodes</span>
            <span className="stat">depth {apiResult.maxDepth}</span>
            <span className={`stat stat--algo stat--algo-${algorithm}`}>{algorithm.toUpperCase()}</span>
          </div>
        )}
      </header>

      <div className="app-body">
        <InputPanel
          mode={mode}             setMode={setMode}
          url={url}               setUrl={setUrl}
          html={html}             setHtml={setHtml}
          algorithm={algorithm}   setAlgorithm={setAlgorithm}
          selector={selector}     setSelector={setSelector}
          resultMode={resultMode} setResultMode={setResultMode}
          topN={topN}             setTopN={setTopN}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />

        <main className="app-output">
          {apiResult ? (
            <TreeVisualizer
              tree={apiResult.tree}
              traversalLog={apiResult.traversalLog}
              animPhase={animPhase}
              onZoomDone={handleZoomDone}
              onTraverseDone={handleTraverseDone}
            />
          ) : (
            <div className="output-placeholder">
              {isLoading
                ? <div className="loading-ring" />
                : <p>Configure inputs and press <strong>Go</strong> to visualise traversal</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

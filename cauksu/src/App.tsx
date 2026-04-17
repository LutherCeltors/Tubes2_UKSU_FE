
import './App.css'
import { useState } from 'react'

type RequestData = {
  mode: "URL" | "MANUAL"
  url?: string
  html?: string
  algorithm: "BFS" | "DFS"
  selector: string
  resultMode: "TOP" | "ALL"
  topN?: number
}



function App() {
  const [mode, setMode] = useState<"URL" | "MANUAL">("URL")
  const [url, setUrl] = useState("")
  const [html, setHtml] = useState("")
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs")
  const [selector, setSelector] = useState("")
  const [resultMode, setResultMode] = useState<"TOP" | "ALL">("ALL")
  const [topN, setTopN] = useState(10)

  const handleSubmit = async () => {
    const data = {
      mode,
      url: mode === "URL" ? url : undefined,
      html: mode === "MANUAL" ? html : undefined,
      algorithm,
      selector,
      resultMode,
      topN: resultMode === "TOP" ? topN : undefined,
    }

    const res = await fetch("http://localhost:8080/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    console.log(result)
  }

  return (
    <div className='bg-gray-700 h-screen'>
      <header className='bg-gray-800 h-20 flex items-center'>
        <h1 className='text-white pl-8'>CAUKSU</h1>
      </header>
      <div className='flex h-full'>
        {/* Input field */}
        <div className="flex flex-col flex-[1] bg-gray-200 gap-3 p-2">

          {/* MODE */}
          <button
            onClick={() => setMode(mode === "URL" ? "MANUAL" : "URL")}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Mode: {mode}
          </button>

          {/* URL / HTML */}
          {mode === "URL" ? (
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://entahapalah.com"
              className="p-2 border rounded"
            />
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<h1>Enter HTML<h1>"
              className="p-2 border rounded h-32"
            />
          )}

          {/* ALGORITHM */}
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as "bfs" | "dfs")}
            className="p-2 border rounded"
          >
            <option value="bfs">BFS</option>
            <option value="dfs">DFS</option>
          </select>

          {/* CSS SELECTOR */}
          <input
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder=".box, #header, div > p"
            className="p-2 border rounded"
          />

          {/* RESULT MODE */}
          <select
            value={resultMode}
            onChange={(e) => setResultMode(e.target.value as "TOP" | "ALL")}
            className="p-2 border rounded"
          >
            <option value="ALL">All</option>
            <option value="TOP">Top N</option>
          </select>

          {/* TOP N */}
          {resultMode === "TOP" && (
            <input
              type="number"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="p-2 border rounded"
            />
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white p-2 rounded mt-2"
          >
            Search
          </button>

        </div>

        {/* Output field */}
        <div className='flex flex-col flex-[3] bg-gray-700'>

        </div>
      </div>
    </div>
  )
}

export default App

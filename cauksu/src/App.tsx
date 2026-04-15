
import './App.css'
import { useState } from 'react'

function App() {
  const [mode, setMode] = useState("url")

  return (
    <div className='bg-gray-700 h-screen'>
      <header className='bg-gray-800 h-20 flex items-center'>
        <h1 className='text-white pl-8'>CAUKSU</h1>
      </header>
      <div className='flex h-screen'>
        {/* Input field */}
        <div className='flex flex-col flex-[1] bg-gray-200'>
          <button
            onClick={() => setMode(mode === "URL" ? "MANUAL" : "URL")}
            className='bg-blue-500 text-white p-2 m-4 rounded'
          >
            switch mode
          </button>
          <div className='p-6 flex flex-col'>
            <p>Insert Depth: </p>
            <input
              type="number"
              className="border rounded w-full"
              placeholder="Depth..."
            />
          {mode === "URL" ? (
            <>
            <p>Insert URL: </p>
            <input
              type="text"
              className="border rounded w-full"
              placeholder="https://entahapalah.com"
            />
            </>
          ) : (
            <>
            <p>Insert HTML: </p>
             <textarea
              className="border rounded w-full h-40"
              placeholder="<html>...</html>"
            />
            </>
          )}
          </div>
        </div>

        {/* Output field */}
        <div className='flex flex-col flex-[3] bg-gray-700'>

        </div>
      </div>
    </div>
  )
}

export default App

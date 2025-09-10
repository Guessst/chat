import { useState } from 'react'
import { Chat } from './Chat'

const SERVER_IP = "http://localhost:8000"

export default function App() {
  const [count, setCount] = useState<number>(0)

  const getFromServer = async () => {
    const res = await fetch(`${SERVER_IP}/api/example`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })

    alert((await res.json()).data)
  }

  const postToServer = async () => {
    const res = await fetch(`${SERVER_IP}/api/example`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msg: "123"
      })
    })

    alert((await res.json()).data)
  }

  return (
    <>
      <p>teste</p>
      <div>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <br/>
        
        <button onClick={getFromServer}>getFromServer</button>
        <br/>

        <button onClick={postToServer}>postToServer</button>
        <br/>
      </div>
      <Chat/>
    </>
  )
}

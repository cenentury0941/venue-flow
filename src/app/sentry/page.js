"use client"

import Image from "next/image";
import { socket } from "../../socket";
import { useEffect, useState } from "react";
import clsx from "clsx";

export default function Sentry(){
    const [connected, setConnected] = useState(false)

    useEffect( () => {
        socket.on("connect" , ()=>{
            setConnected(true)
        })
        socket.on("disconnect" , ()=>{
            setConnected(false)
        })
        socket.connect()

        const pingInterval = setInterval(() => {
            const start = Date.now();
          
            socket.emit("ping", () => {
                setConnected(true)
            });
          }, 3900);

        return () => {
            socket.disconnect()
        }
    } , [] )

    return <div className="flex flex-col p-4 h-screen w-screen">
        <Image alt="logo" src="/sentry_icon.png" height="512" width="512" />
        <h2 className="text-3xl">Welcome To</h2>
        <h1 className="w-fit text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r to-cyan-500 via-purple-500 from-pink-500">Sentry</h1>
        <h3 className="text-m mt-4">Here, you can receive and view all transmissions from the venueflow-postprocessor!</h3>
        
        <div className={clsx("my-4 mx-4 py-4 px-4 rounded-xl transition-all duration-500 bg-gradient-to-r",
        { "from-pink-500 via-purple-500 to-cyan-500" : connected },
        { "from-yellow-500 via-orange-500 to-red-500" : !connected })
        }>
            { connected ? "Connected To The Server!" : "Not Connected To The Server" }
        </div>

        <hr className="w-48 h-1 mx-auto my-4 bg-gray-100 border-0 rounded-sm md:my-10 dark:bg-gray-700" />
        <h2 className="w-fit text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r to-cyan-500 via-purple-500 from-pink-500">Alerts</h2>
    </div>
}
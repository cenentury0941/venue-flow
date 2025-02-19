"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";
import { FixedLengthQueue } from "@/utils/queue";
import { clsx } from 'clsx';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [timerState, setTimerState] = useState("N/A");
  const [remainingTime, setRemainingTime] = useState(0);
  const [ping, setPing] = useState(0);
  const [avgPing, setAvgPing] = useState(0);
  const [pingBasedDuration, setPingBasedDuration] = useState(-1)
  var timerInterval = null;
  var intervalTerminator = null;
  const pingList = new FixedLengthQueue(3);
  var lastTime = null;
  var targetTime = null;

  function onUpdate(currentState) {
    setTimerState(currentState);
  }

  useEffect(() => {
    socket.on("update", (state) => {

      const value = state.state
      const timeDuration = state.timeDuration

      console.log(state)

      onUpdate(value)
      if(value == "STOPPED")
      {
        if(timerInterval != null){
          clearInterval(timerInterval)
          timerInterval = null
          clearTimeout(intervalTerminator)
          intervalTerminator = null
        }
        targetTime = null
        setRemainingTime(formatMilliseconds(timeDuration));
      }
      else if(value == "PAUSED"){
        if(timerInterval != null){
          clearInterval(timerInterval)
          timerInterval = null
          clearTimeout(intervalTerminator)
          intervalTerminator = null
          targetTime = null
        }
        setRemainingTime(formatMilliseconds(timeDuration));
      }
      else if(value == "RUNNING"){
        lastTime = Date.now();
        if(targetTime == null)
        {
          setPingBasedDuration( timeDuration - pingList.avg() )
          targetTime = Date.now() + timeDuration - pingList.avg()
          setRemainingTime( formatMilliseconds(targetTime - Date.now()) )
        }
        if(timerInterval == null)
        {
          timerInterval = setInterval(() => {
            setRemainingTime(formatMilliseconds(Math.max((targetTime-Date.now()),0)))
            lastTime = Date.now()
          }, 20)

          intervalTerminator = setTimeout( () => {
            if(timerInterval != null){
              clearInterval(timerInterval)
              timerInterval = null
              targetTime = null
            }
          } , ( timeDuration+1000 ) )
        }
      }
    });

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    const pingInterval = setInterval(() => {
      const start = Date.now();
    
      socket.emit("ping", () => {
        const duration = (Date.now() - start)/2;
        console.log(duration);
        setPing(duration);
        pingList.enqueue(duration);
        setAvgPing(pingList.avg());
      });
    }, 3900);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("update", (value) => {onUpdate(value)});
      socket.disconnect()
      clearInterval(pingInterval)
    };
  }, []);

  return (
    <div>
    <div className="p-4">
      <p>Status: { isConnected ? "connected" : "disconnected" }</p>
      <p>Transport: { transport }</p>
      <p>Timer State: {timerState}</p>
      <p>Ping: {ping} | avg : {avgPing}</p>
      <p>Ping Based Duration: {pingBasedDuration}</p>
    </div>
    <div className="grid grid-cols-2 grid-rows-2 pr-16 pl-16 mt-32 place-items-center">
      
    <h1 className="mb-4 text-5xl font-light text-center tracking-tight text-cyan-200 md:text-9xl lg:text-6xl col-span-2">
    {remainingTime}
    </h1>

    <button type="button"  onClick={()=>{socket.emit("start/pause");}}
     className={clsx("h-16 md:w-96 w-32 text-white bg-blue-700 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 place-self-end",
      {
        "bg-green-700" : timerState != "RUNNING"
      }
    )}>
      { timerState == "RUNNING" ? "Pause" : ( timerState == "STOPPED" ? "Start" : "Resume" ) }
    </button>
    
    <button type="button" onClick={()=>{socket.emit("reset");}} 
      className="h-16 md:w-96 w-32 text-white bg-red-700 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 place-self-start">
      Reset
    </button>
    
    </div>
    </div>
  );
}

function formatMilliseconds(ms) {
  // Convert milliseconds to seconds
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;

  // Format seconds and milliseconds to "00.000" format
  const formattedTime = `${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;

  return formattedTime;
}
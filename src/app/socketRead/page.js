"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";
import { FixedLengthQueue } from "@/utils/queue";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [timerState, setTimerState] = useState("N/A");
  const [ping, setPing] = useState("N/A");
  const [avgPing, setAvgPing] = useState("N/A");
  const pingList = new FixedLengthQueue(3);

  useEffect(() => {
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

    function onUpdate(currentState) {
        setTimerState(currentState);
      }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("update", (value) => {onUpdate(value)});

    const pingInterval = setInterval(() => {
      const start = Date.now();
    
      socket.emit("ping", () => {
        const duration = Date.now() - start;
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
      clearInterval(pingInterval)
    };
  }, []);

  return (
    <div>
      <p>Status: { isConnected ? "connected" : "disconnected" }</p>
      <p>Transport: { transport }</p>
      <p>Timer State: {timerState}</p>
      <p>Ping: {ping} | avg : {avgPing}</p>
    </div>
  );
}
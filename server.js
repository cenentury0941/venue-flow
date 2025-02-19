import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

var timerState = "STOPPED"
const timerDuration = 15000

var targetTime = null
var timeLeftOnPause = null

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  const updateAll = (data, socket) => {
    if(socket)
    {
      socket.emit("update",data)
      return
    }
    io.emit("update",data)
  }

  io.on("connection", (socket) => {
    console.log("connecting...")

    var initTime = 0

    if(timerState != "STOPPED")
    {
      if(timerState == "RUNNING"){
        initTime = targetTime - Date.now()
      }
      else if(timeLeftOnPause){
        initTime = timeLeftOnPause 
      }
      console.log(`TimeLeftOnPause : ${timeLeftOnPause}`)
    }

    setTimeout( () => {
      updateAll({
        state: timerState,
        timeDuration: initTime
      }, socket)
    } , 20 )

    socket.on("start/pause", (msg)=>{

      console.log(msg)
      var isResume = timerState == "PAUSED"
      var isStart = timerState == "STOPPED"
      var isPause = timerState == "RUNNING"
      var timeToSend = timerDuration
      const currentTime = Date.now()

      if(isStart)
      {
        targetTime = currentTime + timerDuration
      }

      if(isResume)
      {
        if(timeLeftOnPause)
        {
          timeToSend = timeLeftOnPause
          targetTime = currentTime + timeLeftOnPause
        }
        timeLeftOnPause = null
      }
      else{
        if(targetTime > currentTime)
        {
          timeLeftOnPause = targetTime - Date.now()
        }
        else{
          timeLeftOnPause = null
          targetTime = null
        }
      }

      if(isPause)
      {
        timeToSend = timeLeftOnPause
      }

      timerState = timerState == "RUNNING" ? "PAUSED" : "RUNNING"
      updateAll({
        state: timerState,
        timeDuration: timeToSend
      })
    })

    socket.on("reset", (msg)=>{
      console.log(msg)
      timerState = "STOPPED"
      targetTime = null
      updateAll({
        state: timerState,
        timeDuration: 0
      })
    })

    socket.on("ping", (callback) => {
      callback();
    });

  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
import * as child     from "child_process";
import * as socketio  from "socket.io";
import * as mc        from "minecraft-protocol";
import * as path      from "path";

import { 
  lstat,
  exists,
  readFile,
  readDir 
} from "./util";

import {
  Status
} from "./enums";
import { ServerInstance } from "./ServerInstance";


let serverStatus: Status        = Status.OFFLINE;
let server: child.ChildProcess  = null;

const isServerOnline = (): boolean => {
  return serverStatus === Status.ONLINE;
}

const isValidDirectory = async (source: string): Promise<any> => {
  const isDirectory = (await lstat(source)).isDirectory();

  let ret = null;

  if (isDirectory) {
    const configPath = path.join(source, "config.json");
    const configExists = await exists(configPath);

    if (configExists) {
      ret = await readFile(configPath);
    }
  }

  return ret;
}

const mainOld = async () => {

  const io = socketio.listen(3001);

  setTimeout(() => pinger(io), 5000);

  io.on("connection", async (socket) => {
    console.log("Socket connected!");

    socket.emit("status", serverStatus);

    const currentLog = await readFile("./logs/latest.log");

    socket.emit("log", currentLog.toString("utf8"));

    socket.on("START_SERVER", async () => {
      serverStatus = Status.LOADING;
      io.emit("status", serverStatus);

      try {
        server = child.spawn("java", ["-Xmx1G", "-Xms1G", "-jar", "./bin/server.jar", "nogui"]);

        server.stdout.pipe(process.stdout);
        server.stderr.pipe(process.stderr);

        server.on("exit", () => {
          server = null;
          serverStatus = Status.OFFLINE;
          io.emit("status", serverStatus);
        });
  
        server.on("close", (code: number, signal: string) => {
          server = null;
          serverStatus = Status.OFFLINE;
          io.emit("status", serverStatus);
        });

        server.stdout.on("data", (data) => {
          if (!isServerOnline()) {
            serverStatus = Status.ONLINE;
            io.emit("status", serverStatus);
          }
  
          io.emit("console", data.toString("utf8"));
        });
      } catch (e) {
        console.error("EXCEPTION:", e.message);
      }
     
    });

    socket.on("STOP_SERVER", () => {
      io.emit("status", Status.LOADING);

      if (server) {
        server.stdin.write("stop\n");
      }
    });

    socket.on("SAVE_WORLD", () => {
      if (server) {
        server.stdin.write("save-all\n");
      }
    });

    socket.on("COMMAND", (data) => {
      if (server) {
        server.stdin.write(data + "\n");
      }
    })
    
  });
}

const pinger = (io: socketio.Server) => {
  
  if (isServerOnline()) {
    mc.ping({ host: 'localhost', port: 25565 }, (err, response) => {
      if (err) {
        console.error(err);
      } else {
        io.emit("ping", response);
      }
    });
  }

  setTimeout(() => pinger(io), 5000);
}

class Server {

  public serverList: any[];
  public instances: Map<string, ServerInstance>;
  public io: socketio.Server;

  constructor() {
    this.serverList = [];
    this.instances = new Map<string, ServerInstance>();
    this.io = socketio.listen(3001);
  }

  public async Init(): Promise<Server> {
    this.serverList = await this.getServerList("./servers");

    this.io.on("connection", (socket: SocketIO.Socket) => {
      socket.emit("init", this.serverList);

      socket.on("instance", (request: string) => {
        console.log(request);
      });
    });

    // this.io.on("instance", (request: string) => {
    //   console.log(request);
    // })

    return this;
  }

  private async getServerList(source: string): Promise<any[]> {
    const ret: any[] = [];

    const folders = await readDir(source);

    for (let folder of folders) {
      const folderPath = path.join(source, folder);
      const buffer: Buffer = await isValidDirectory(folderPath);

      if (buffer) {
        ret.push(JSON.parse(buffer.toString("utf8")));
      }
    }

    return ret;
  }
}

new Server().Init().then(server => {
  console.log(server.serverList);
})

// process.stdin.resume();
// process.stdin.on('data', function (data) {
// 	if (server) {
// 		server.stdin.write(data);
// 	}
// });
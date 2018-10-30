import * as child from "child_process";
import * as mc from "minecraft-protocol";
import * as path from "path";

import { Status } from "./enums";
import { readFile } from "./util";
import { IServerConfig } from "./interfaces";

export class ServerInstance {
  public data: IServerConfig;
  public status: Status;
  public child: child.ChildProcess;

  private io: SocketIO.Server;

  constructor(_data: IServerConfig, _io: SocketIO.Server) {
    this.data = _data;
    this.io = _io;

    setTimeout(() => {
      this.pinger(this.io);
    }, 5000);
  }

  private isServerOnline(): boolean {
    return this.status === Status.ONLINE;
  }

  private pinger(io: SocketIO.Server): void {
    if (this.isServerOnline()) {
      mc.ping({ host: 'localhost', port: 25565 }, (err, response) => {
        if (err) {
          console.error(err);
        } else {
          io.emit("ping", response);
        }
      });
    }
  
    setTimeout(() => this.pinger(io), 5000);
  }

  public async getLatestLog() {
    const logPath = path.join()
  }

  public async init(): Promise<void> {
    // this.socket.emit("status", this.status);

    // const currentLog = await readFile("./logs/latest.log");

    // this.socket.emit("log", currentLog.toString("utf8"));

    // this.socket.on("START_SERVER", async () => {
    //   this.status = Status.LOADING;
    //   this.io.emit("status", this.status);

    //   try {
    //     this.child = child.spawn("java", ["-Xmx1G", "-Xms1G", "-jar", "./bin/server.jar", "nogui"]);

    //     this.child.stdout.pipe(process.stdout);
    //     this.child.stderr.pipe(process.stderr);

    //     this.child.on("exit", () => {
    //       this.child = null;
    //       this.status = Status.OFFLINE;
    //       this.io.emit("status", this.status);
    //     });
  
    //     this.child.on("close", (code: number, signal: string) => {
    //       this.child = null;
    //       this.status = Status.OFFLINE;
    //       this.io.emit("status", this.status);
    //     });

    //     this.child.stdout.on("data", (data) => {
    //       if (!this.isServerOnline()) {
    //         this.status = Status.ONLINE;
    //         this.io.emit("status", this.status);
    //       }
  
    //       this.io.emit("console", data.toString("utf8"));
    //     });
    //   } catch (e) {
    //     console.error("EXCEPTION:", e.message);
    //   }

    //   this.socket.on("STOP_SERVER", () => {
    //     this.io.emit("status", Status.LOADING);
  
    //     if (this.child) {
    //       this.child.stdin.write("stop\n");
    //     }
    //   });
  
    //   this.socket.on("SAVE_WORLD", () => {
    //     if (this.child) {
    //       this.child.stdin.write("save-all\n");
    //     }
    //   });
  
    //   this.socket.on("COMMAND", (data) => {
    //     if (this.child) {
    //       this.child.stdin.write(data + "\n");
    //     }
    //   });
     
    // });
  }
}
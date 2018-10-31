import * as socketio  from "socket.io";
import * as path      from "path";

import { 
  lstat,
  exists,
  readFile,
  readDir 
} from "./utils";

import { IServerConfig } from "./interfaces";
import { ServerInstance } from "./classes/ServerInstance";

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

class Server {

  public serverList: IServerConfig[];
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

      socket.on("instance", async (request: string) => {
        const instance = await this.getInstance(request);

        socket.emit("status", {
          serverId: request,
          status: instance.status
        });

        const log = await instance.getLatestLog();

        if (log) {
          socket.emit("log", log);
        }
      });

      socket.on("START_SERVER", (request: string) => {
        this.getInstance(request).start();
      });

      socket.on("STOP_SERVER", (request: string) => {
        this.getInstance(request).stop();
      });

      socket.on("SAVE_WORLD", (request: string) => {
        this.getInstance(request).save();
      });

      socket.on("PROPS", async (request: string) => {
        const props = await this.getInstance(request).properties();

        socket.emit("PROPS_DETAILS", {
          serverId: request,
          props
        });
      })

      socket.on("COMMAND", (payload: { serverId: string, command: string }) => {
        const { command, serverId } = payload;

        this.getInstance(serverId).command(command);
      });

    });

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

  private getInstance(_name: string): ServerInstance {
    let instance = this.instances.get(_name);

    if (!instance) {
      const data = this.serverList.find(config => config.id === _name);

      if (data) {
        instance = new ServerInstance(data, this.io);

        this.instances.set(_name, instance);
      }

    }

    return instance;
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
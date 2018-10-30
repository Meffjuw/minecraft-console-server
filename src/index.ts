import * as socketio  from "socket.io";
import * as path      from "path";

import { 
  lstat,
  exists,
  readFile,
  readDir 
} from "./util";

import { IServerConfig } from "./interfaces";
import { ServerInstance } from "./ServerInstance";

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

      socket.on("instance", (request: string) => {
        console.log(request);
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

  private async getInstance(_name: string): Promise<ServerInstance> {
    let instance = this.instances.get(_name);

    if (!instance) {
      const data = this.serverList.find(config => config.id === _name);

      instance = new ServerInstance(data, this.io);

      await instance.init();
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
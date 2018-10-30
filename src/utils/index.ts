import * as fs        from "fs";
import * as util      from "util";

export const readFile  = util.promisify(fs.readFile);
export const readDir   = util.promisify(fs.readdir);
export const lstat     = util.promisify(fs.lstat);
export const exists    = util.promisify(fs.exists);

export class Properties {

  public static parse(source: string) {
    const output: any = {};

    source.split(/[\r\n]+/g).forEach(line => {
        if (line[0] === "#" || line.indexOf("=") < 0) return;

        const parts = line.split("=");

        const key   = parts[0].trim();
        const val   = parts[1].trim();

        if (!key) { 
          return;
        }

        output[key] = this.value(val);
    });

    return output;
  }

  private static value(obj: any) {
    if (obj === "") return null;

    try {
      return JSON.parse(obj);
    } catch (e) {
      return obj;
    }
  }
}
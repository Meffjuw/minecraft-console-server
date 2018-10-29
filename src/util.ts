import * as fs        from "fs";
import * as util      from "util";

export const readFile  = util.promisify(fs.readFile);
export const readDir   = util.promisify(fs.readdir);
export const lstat     = util.promisify(fs.lstat);
export const exists    = util.promisify(fs.exists);
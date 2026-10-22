import { existsSync } from "node:fs";

if (existsSync("out")) await Bun.write("out/.nojekyll", "");

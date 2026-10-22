import { ESLint } from "eslint";
import eslintConfig from "../eslint.config";

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: eslintConfig,
});

const results = await eslint.lintFiles(["."]);
const formatter = await eslint.loadFormatter("stylish");
const output = await formatter.format(results);

if (output) process.stdout.write(output);
if (results.some((result) => result.errorCount > 0)) process.exitCode = 1;

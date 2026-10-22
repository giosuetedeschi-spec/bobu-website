export {};

declare global {
  const Bun: {
    argv: string[];
    file(path: string): Blob & { exists(): Promise<boolean> };
    write(path: string, contents: string): Promise<number>;
    serve(options: { port: number; fetch(request: Request): Response | Promise<Response> }): { url: URL };
    Transpiler: new (options: { loader: "ts" }) => { transform(source: string): Promise<string> };
  };
}

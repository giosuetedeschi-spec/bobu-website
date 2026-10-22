import { withBasePath } from "@/lib/basePath";

export function GameIframe({ src, title }: { src: string; title: string }) {
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        height: "min(78vh, 720px)",
        minHeight: 560,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      <iframe
        src={withBasePath(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title={`${title} game`}
        allowFullScreen
      />
    </div>
  );
}

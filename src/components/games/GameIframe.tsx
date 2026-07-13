import { basePath } from "@/lib/basePath";

export function GameIframe({ src }: { src: string }) {
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        aspectRatio: "16/9",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      <iframe
        src={`${basePath}${src}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Game"
        allowFullScreen
      />
    </div>
  );
}

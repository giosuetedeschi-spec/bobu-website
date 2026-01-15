export function GameIframe({ src }: { src: string }) {
    return (
        <div className="w-full h-full min-h-[600px] glass-panel rounded-xl overflow-hidden">
            <iframe
                src={src}
                className="w-full h-full border-none"
                title="Game"
                allowFullScreen
            />
        </div>
    );
}

export function GameIframe({ src }: { src: string }) {
    return (
        <div className="w-full relative aspect-video glass-panel rounded-xl overflow-hidden shadow-2xl">
            <iframe
                src={src}
                className="absolute inset-0 w-full h-full border-none"
                title="Game"
                allowFullScreen
            />
        </div>
    );
    );
}

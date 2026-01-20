export function Footer() {
    return (
        <footer className="py-8 md:py-12 border-t border-white/5 mt-20">
            <div className="container mx-auto px-4 text-center">
                <p className="text-white/40 text-sm">
                    © {new Date().getFullYear()} Bobu Website. All rights reserved.
                </p>
                <div className="mt-4 flex justify-center gap-6 text-white/40 text-xs">
                    <a href="https://github.com/giosuetedeschi-spec" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Github</a>
                    <a href="https://it.linkedin.com/in/giosu%C3%A8-tedeschi-b287b9225?trk=public_post_feed-actor-name" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://tagembed.com/it/blog/twitter-rebranding-x/" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Twitter</a>
                </div>
            </div>
        </footer>
    );
}

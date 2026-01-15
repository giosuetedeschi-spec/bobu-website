export function Footer() {
    return (
        <footer className="py-8 md:py-12 border-t border-white/5 mt-20">
            <div className="container mx-auto px-4 text-center">
                <p className="text-white/40 text-sm">
                    © {new Date().getFullYear()} Bobu Website. All rights reserved.
                </p>
                <div className="mt-4 flex justify-center gap-6 text-white/40 text-xs">
                    <a href="#" className="hover:text-white transition-colors">Github</a>
                    <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                </div>
            </div>
        </footer>
    );
}

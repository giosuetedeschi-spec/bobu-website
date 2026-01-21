"use client";

import Image from "next/image";

const products = [
    { id: 1, name: "Ceramic Vase", price: "€120", image: "/assets/references/ex1.png" },
    { id: 2, name: "Linen Throw", price: "€85", image: "/assets/references/ex2.png" },
    { id: 3, name: "Oak Table", price: "€450", image: "/assets/references/ex3.png" },
    { id: 4, name: "Glass Lamp", price: "€180", image: "/assets/references/ex4.png" },
];

export default function CollectionPage() {
    return (
        <div className="min-h-screen bg-[#Fdfdfd] text-[#1a1a1a] -mx-4 md:-mx-8 px-4 md:px-8 py-12">
            {/* Override global dark mode for this section to match Aura Quiet Living aesthetic */}
            <style jsx global>{`
          body { background-color: #Fdfdfd !important; color: #1a1a1a !important; }
       `}</style>

            <header className="flex justify-between items-center mb-20">
                <h1 className="font-serif text-3xl italic">Aura.</h1>
                <nav className="text-sm uppercase tracking-widest gap-6 flex">
                    <a href="/ecommerce" className="hover:underline">Shop</a>
                    <a href="/ecommerce/collection" className="underline">Collection</a>
                    <a href="#" className="hover:underline">About</a>
                </nav>
            </header>

            <section className="col-span-12 mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="font-serif text-5xl md:text-7xl leading-tight">Quiet Living <br /> for Modern Souls.</h2>
                    <p className="text-gray-500 max-w-md leading-relaxed">
                        Curated objects that bring peace and beauty to your everyday rituals. Handcrafted with intention and sustainable materials.
                    </p>
                    <button className="px-8 py-4 bg-[#1a1a1a] text-white text-xs uppercase tracking-widest hover:bg-opacity-80 transition-opacity">
                        Explore Collection
                    </button>
                </div>
                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                    <Image
                        src="/assets/references/ex5.png"
                        alt="Hero"
                        fill
                        className="object-cover"
                        onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7")}
                    />
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {products.map((p) => (
                    <div key={p.id} className="group cursor-pointer">
                        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden mb-4">
                            <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => (e.currentTarget.src = `https://images.unsplash.com/photo-${1500000000000 + p.id}`)}
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-white/90 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center">
                                <span className="text-xs uppercase tracking-widest">Add to Cart</span>
                                <span className="font-serif italic">{p.price}</span>
                            </div>
                        </div>
                        <h3 className="font-serif text-xl">{p.name}</h3>
                        <p className="text-gray-400 text-sm">Artisan made</p>
                    </div>
                ))}
            </section>
        </div>
    );
}

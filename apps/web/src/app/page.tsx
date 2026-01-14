export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        {/* Logo */}
        <h1 className="text-6xl font-bold tracking-tight">
          OVENIR
        </h1>
        
        {/* Tagline */}
        <p className="text-xl text-gray-400">
          Developer tools. Local. Private. Fast.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-3 gap-6 pt-8">
          <div className="space-y-2">
            <div className="text-3xl">🔒</div>
            <p className="text-sm text-gray-500">100% Client-side</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">⚡</div>
            <p className="text-sm text-gray-500">Instant results</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🌐</div>
            <p className="text-sm text-gray-500">Works offline</p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="pt-8">
          <span className="px-6 py-3 bg-white text-black rounded-full font-medium">
            Coming Soon
          </span>
        </div>
        
        {/* GitHub */}
        <p className="text-sm text-gray-600 pt-8">
          <a 
            href="https://github.com/ovenirdev/ovenir" 
            target="_blank"
            className="hover:text-white transition-colors"
          >
            Open Source on GitHub →
          </a>
        </p>
      </div>
    </main>
  );
}

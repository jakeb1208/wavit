import React, { useState, useEffect } from 'react';
import { Menu, X, Clock, Users, ArrowRight, QrCode, Smartphone, MessageCircle, Instagram, Scissors, Sparkles, Building2 } from 'lucide-react';

export function Homepage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-['Inter'] overflow-x-hidden selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
        
        .blob {
          position: absolute;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.4;
          animation: float 10s infinite ease-in-out alternate;
        }
        
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -50px) scale(1.1); }
          100% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(7,11,20,0) 70%); }
        .blob-2 { top: 20%; right: -20%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(7,11,20,0) 70%); animation-delay: -5s; }
        .blob-3 { bottom: -20%; left: 20%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(7,11,20,0) 70%); animation-delay: -2s; }

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        
        .glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
        }

        .btn-pill {
          border-radius: 9999px;
          transition: all 0.2s ease;
        }
        
        .btn-pill:hover {
          transform: scale(1.03);
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }
        .btn-primary:hover {
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-secondary:hover {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        
        .status-dot {
          animation: pulse-ring 2s infinite;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0.2;
        }
      `}} />

      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['Pacifico'] text-3xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              wavit
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#" className="hover:text-white transition-colors">Search</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">For Businesses</a>
          </div>

          <div className="hidden md:block">
            <button className="btn-pill btn-secondary px-6 py-2.5 text-sm font-medium text-white">
              Log In
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#070b14]/95 backdrop-blur-xl pt-24 px-6 flex flex-col gap-6 md:hidden">
          <a href="#" className="text-xl font-medium text-white">Home</a>
          <a href="#" className="text-xl font-medium text-gray-300">Search</a>
          <a href="#" className="text-xl font-medium text-gray-300">About</a>
          <a href="#" className="text-xl font-medium text-gray-300">For Businesses</a>
          <button className="btn-pill btn-primary px-6 py-3 mt-4 text-white font-medium w-full">
            Log In
          </button>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full text-sm font-medium text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-500 status-dot"></span>
              Live Queue Updates Active
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
              Never Wait <br className="hidden md:block" /> Blindly.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-light leading-relaxed">
              Real-time queues for the places you love. See your spot, track your wait, and show up exactly when you're needed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
              <button className="btn-pill btn-primary px-8 py-4 text-white font-semibold text-lg w-full sm:w-auto flex items-center justify-center gap-2">
                View Live Shops
                <ArrowRight size={20} />
              </button>
              <button className="btn-pill btn-secondary px-8 py-4 text-white font-medium text-lg w-full sm:w-auto">
                Join a Queue
              </button>
              <button className="btn-pill border border-white/10 hover:border-white/20 hover:bg-white/5 px-8 py-4 text-white font-medium text-lg w-full sm:w-auto transition-all">
                For Businesses
              </button>
            </div>
          </div>
        </section>

        {/* Live Right Now */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Right Now</h2>
              <p className="text-gray-400 text-lg">See what's happening at shops near you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Elite Cuts Barbershop", category: "Barber", wait: "~12 min", queue: 4, status: "Open", icon: Scissors },
                { name: "Glow Beauty Studio", category: "Salon", wait: "~25 min", queue: 7, status: "Busy", icon: Sparkles },
                { name: "The Barber Lab", category: "Barber", wait: "~5 min", queue: 1, status: "Open", icon: Scissors },
              ].map((shop, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <shop.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{shop.name}</h3>
                        <span className="text-xs font-medium text-gray-400 px-2 py-1 rounded-md bg-white/5 uppercase tracking-wider">{shop.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/5">
                      <span className={`w-1.5 h-1.5 rounded-full ${shop.status === 'Open' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {shop.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-1.5">
                        <Clock size={14} /> Wait Time
                      </div>
                      <div className="text-2xl font-semibold text-white">{shop.wait}</div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-1.5">
                        <Users size={14} /> In Queue
                      </div>
                      <div className="text-2xl font-semibold text-white">{shop.queue}</div>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-blue-500 hover:border-blue-500 transition-all duration-300">
                    Join Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6 relative border-y border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Skip the physical waiting room. Claim your spot from anywhere and show up exactly when you're up.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 z-0"></div>
              
              {[
                { title: "Scan or Search", desc: "Find your shop via QR code or search by name in our directory.", icon: QrCode },
                { title: "Watch Your Wait", desc: "See your live position and estimated wait time updated in real-time.", icon: Smartphone },
                { title: "Get Texted", desc: "Receive an SMS the moment your turn is approaching. No app required.", icon: MessageCircle },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-20 h-20 rounded-3xl glass-panel flex items-center justify-center mb-6 relative">
                    <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-b from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      {i + 1}
                    </div>
                    <step.icon size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Businesses */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/3">
                <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
                  For Businesses
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Built for Modern Businesses</h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  Transform your waiting area. Give your customers their time back while keeping your chairs full and your staff efficient.
                </p>
                <button className="btn-pill btn-primary px-8 py-4 text-white font-semibold text-lg w-full sm:w-auto">
                  Apply to Join Wavit
                </button>
              </div>
              
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {[
                  { title: "Live Queue Management", desc: "Easily manage who's next and see incoming customers.", icon: Users },
                  { title: "Auto SMS Notifications", desc: "Customers get automated text updates as their turn approaches.", icon: MessageCircle },
                  { title: "Real-time Analytics", desc: "Track wait times, customer flow, and staff efficiency.", icon: Building2 },
                  { title: "Zero App Downloads", desc: "Customers join via a simple web link—no app required.", icon: Smartphone },
                ].map((feature, i) => (
                  <div key={i} className="glass-panel p-6 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-purple-400">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 relative z-10 bg-[#04070a]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <span className="font-['Pacifico'] text-2xl tracking-wide text-white">
              wavit
            </span>
          </div>
          
          <div className="flex-1 flex justify-center gap-6 text-sm text-gray-400">
            <a href="mailto:wavitapp@gmail.com" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          
          <div className="flex-1 flex justify-end gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <Instagram size={20} />
            </div>
          </div>
        </div>
        
        <div className="text-center py-6 text-xs text-gray-600 border-t border-white/5">
          © 2025 Wavit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

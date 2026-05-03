import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Zap, Shield, Star, Cookie } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-20 flex items-center border-b-2 border-primary/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <img src="/logo.png" alt="GetStuffed Logo" className="w-10 h-10 group-hover:rotate-12 transition-transform" />
          <span className="text-2xl font-black tracking-tighter text-foreground">
            Get<span className="text-primary">Stuffed</span>
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-bold hover:text-primary transition-colors" href="/auth/login">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button className="rounded-full font-bold shadow-md hover:shadow-lg transition-all">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="inline-flex items-center rounded-full border-2 border-primary/20 bg-primary/5 px-3 py-1 text-sm font-bold text-primary animate-bounce">
                <Cookie className="mr-2 h-4 w-4" />
                South Africa's Sweetest Invoicing Tool
              </div>
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Invoicing so good, it's <span className="text-primary italic underline decoration-wavy decoration-secondary/30">Indulgent.</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl font-medium leading-relaxed">
                  Manage your business with the same love and care you put into your cookies. Create professional invoices and estimates in seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform">
                    Start Billing Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl border-2 hover:bg-muted">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="pt-8 flex items-center gap-4 text-sm text-muted-foreground font-semibold">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                Trusted by 100+ local bakers and makers
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white rounded-[3rem] shadow-inner relative z-10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-primary/5 transition-colors">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Fast as a Snack</h3>
                <p className="text-muted-foreground font-medium">
                  Create invoices faster than you can eat a cookie. Templates ready to go.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-secondary/5 transition-colors">
                <div className="p-4 bg-secondary/10 rounded-2xl">
                  <Shield className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold">Securely Stuffed</h3>
                <p className="text-muted-foreground font-medium">
                  Your data is protected with industry-standard security. Safe and sound.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl hover:bg-primary/5 transition-colors">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Easy Estimates</h3>
                <p className="text-muted-foreground font-medium">
                  Convert estimates to invoices with a single click. No crumbs left behind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-primary text-white rounded-[3rem] p-8 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-20">
                 <Cookie className="w-32 h-32 rotate-12" />
               </div>
               <div className="space-y-4">
                 <h2 className="text-3xl md:text-5xl font-black tracking-tight">Ready to get stuffed?</h2>
                 <p className="text-primary-foreground/90 text-lg md:text-xl font-medium max-w-[600px]">
                   Join the sweetest invoicing platform in South Africa and take your business to the next level.
                 </p>
               </div>
               <Link href="/auth/signup">
                 <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-primary">
                   Create Free Account
                 </Button>
               </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-[#FAF9F6] border-t-2 border-primary/5">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link className="flex items-center gap-2" href="#">
              <img src="/logo.png" alt="GetStuffed Logo" className="w-8 h-8" />
              <span className="text-xl font-black tracking-tighter">
                Get<span className="text-primary">Stuffed</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground font-medium text-center md:text-left max-w-[300px]">
              The #1 invoicing tool for South African artisans, bakers, and makers.
            </p>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Product</span>
              <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/dashboard/invoices">Invoices</Link>
              <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/dashboard/estimates">Estimates</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Support</span>
              <Link className="text-sm font-semibold hover:text-primary transition-colors" href="mailto:info@getstuffedcookies.co.za">Contact</Link>
              <Link className="text-sm font-semibold hover:text-primary transition-colors" href="#">FAQ</Link>
            </div>
          </div>
          <div className="text-center md:text-right">
             <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">© 2024 GetStuffed Cookies</p>
             <div className="flex justify-center md:justify-end gap-4">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
             </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Zap, Shield, Star, Cookie } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFBF5]">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <header className="px-6 h-24 flex items-center bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-primary/5">
        <Link className="flex items-center justify-center gap-3 group" href="#">
          <div className="bg-brand-gradient p-1.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="GetStuffed Logo" className="w-10 h-10" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground">
            Get<span className="text-primary">Stuffed</span>
          </span>
        </Link>
        <nav className="ml-auto flex gap-6 items-center">
          <Link className="text-base font-bold text-muted-foreground hover:text-primary transition-colors" href="/auth/login">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-brand-gradient rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 border-none">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-48 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-12 text-center">
              <div className="inline-flex items-center rounded-full border-2 border-primary/20 bg-white px-4 py-1.5 text-sm font-black text-primary shadow-sm">
                <Cookie className="mr-2 h-4 w-4" />
                SOUTH AFRICA'S SWEETEST INVOICING TOOL
              </div>
              
              <div className="space-y-6 max-w-4xl">
                <h1 className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl leading-[1.1]">
                  Invoicing so good, it&apos;s <span className="bg-brand-gradient bg-clip-text text-transparent italic px-2">Indulgent.</span>
                </h1>
                <p className="mx-auto max-w-[800px] text-muted-foreground text-lg md:text-2xl font-medium leading-relaxed">
                  Manage your business with the same love and care you put into your cookies. 
                  Create professional invoices and estimates in seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center pt-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-brand-gradient h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all duration-300 border-none">
                    Start Billing Now <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-black rounded-2xl border-4 border-primary/10 hover:border-primary/20 hover:bg-white transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="pt-12 flex flex-col items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-secondary/20 flex items-center justify-center text-xs font-black text-secondary shadow-md overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-base text-muted-foreground font-bold">
                  Trusted by <span className="text-foreground">250+</span> local bakers and makers across SA
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 md:py-32 bg-white rounded-[4rem] shadow-2xl relative z-10 mx-auto max-w-[95%] mb-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="p-6 bg-primary/5 rounded-[2rem] group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <Zap className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black">Fast as a Snack</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    Create invoices faster than you can eat a cookie. Templates ready to go.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="p-6 bg-secondary/5 rounded-[2rem] group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-sm">
                  <Shield className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black">Securely Stuffed</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    Your data is protected with industry-standard security. Safe and sound.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6 text-center group">
                <div className="p-6 bg-primary/5 rounded-[2rem] group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black">Easy Estimates</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    Convert estimates to invoices with a single click. No crumbs left behind.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-brand-gradient text-white rounded-[4rem] p-12 md:p-24 flex flex-col items-center text-center space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10">
                 <Cookie className="w-64 h-64 rotate-12" />
               </div>
               <div className="absolute bottom-0 left-0 p-12 opacity-10">
                 <Cookie className="w-48 h-48 -rotate-12" />
               </div>
               
               <div className="space-y-6 relative z-10">
                 <h2 className="text-4xl md:text-7xl font-black tracking-tight">Ready to get stuffed?</h2>
                 <p className="text-white/80 text-xl md:text-2xl font-medium max-w-[700px] mx-auto">
                   Join the sweetest invoicing platform in South Africa and take your business to the next level.
                 </p>
               </div>
               
               <Link href="/auth/signup" className="relative z-10">
                 <Button size="lg" variant="secondary" className="h-20 px-16 text-2xl font-black rounded-3xl shadow-2xl hover:scale-105 hover:bg-white transition-all duration-300 text-primary">
                   Create Free Account
                 </Button>
               </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-20 bg-[#FAF9F6] border-t border-primary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-16">
            <div className="flex flex-col items-center md:items-start gap-6">
              <Link className="flex items-center gap-3" href="#">
                <div className="bg-brand-gradient p-1 rounded-xl">
                  <img src="/logo.png" alt="GetStuffed Logo" className="w-8 h-8" />
                </div>
                <span className="text-2xl font-black tracking-tighter">
                  Get<span className="text-primary">Stuffed</span>
                </span>
              </Link>
              <p className="text-lg text-muted-foreground font-medium text-center md:text-left max-w-[350px]">
                The #1 invoicing tool for South African artisans, bakers, and makers.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 sm:gap-24">
              <div className="flex flex-col gap-4">
                <span className="font-black uppercase text-xs tracking-widest text-muted-foreground">Product</span>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="/dashboard/invoices">Invoices</Link>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="/dashboard/estimates">Estimates</Link>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="/dashboard/customers">Customers</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="font-black uppercase text-xs tracking-widest text-muted-foreground">Company</span>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="mailto:info@getstuffedcookies.co.za">Contact</Link>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="#">About Us</Link>
                <Link className="text-base font-bold hover:text-primary transition-colors" href="#">Privacy</Link>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">© 2024 GetStuffed Cookies. All rights reserved.</p>
            <p className="text-sm text-muted-foreground font-bold">Made with 🍪 in Cape Town</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


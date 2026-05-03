import { AuthForm } from '@/components/auth-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] relative overflow-hidden p-4">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[150px]" />
      </div>

      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-brand-gradient p-1.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="Logo" className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground">
            Get<span className="text-primary">Stuffed</span>
          </span>
        </Link>
      </div>

      <AuthForm type="signup" />
    </div>
  )
}

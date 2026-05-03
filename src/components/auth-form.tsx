'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AuthForm({ type }: { type: 'login' | 'signup' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Logged in successfully')
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              username: username || (email === 'admin@getstuffed.co.za' ? 'Admin' : 'User')
            }
          },
        })
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('This email is already registered. Please try logging in.')
          } else {
            throw error
          }
        } else {
          toast.success('Signup successful! Please check your email to verify your account.')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-none shadow-[0_20px_50px_rgba(233,53,10,0.15)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
      <CardHeader className="space-y-4 text-center bg-brand-gradient pb-10 pt-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-black rounded-full blur-3xl"></div>
        </div>
        
        <div className="flex justify-center mb-2 relative z-10">
          <div className="p-1 bg-white rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <img 
              src="/logo.png" 
              alt="GetStuffed Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>
        <div className="relative z-10 space-y-2">
          <CardTitle className="text-3xl font-black tracking-tight text-white">
            {type === 'login' ? 'Welcome Back' : 'Join GetStuffed'}
          </CardTitle>
          <CardDescription className="text-white/80 text-sm font-medium max-w-[280px] mx-auto">
            {type === 'login' 
              ? 'Access your premium invoicing dashboard and manage your business' 
              : 'Create your account and start sending professional invoices today'}
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="grid gap-5 py-10 px-8">
          {type === 'signup' && (
            <div className="grid gap-2.5">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Business Guru"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={type === 'signup'}
                className="rounded-2xl border-2 border-muted/50 h-12 focus-visible:ring-primary focus-visible:border-primary transition-all bg-muted/20"
              />
            </div>
          )}
          <div className="grid gap-2.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="hello@getstuffed.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-2xl border-2 border-muted/50 h-12 focus-visible:ring-primary focus-visible:border-primary transition-all bg-muted/20"
            />
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="password" university-id="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-2xl border-2 border-muted/50 h-12 focus-visible:ring-primary focus-visible:border-primary transition-all bg-muted/20"
            />
          </div>
          {type === 'login' && (
            <div className="flex items-center justify-end">
              <Button variant="link" className="px-0 h-auto font-bold text-primary hover:text-primary/80 text-sm" type="button">
                Forgot password?
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-6 pb-12 px-8">
          <Button 
            className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-brand-gradient border-none" 
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : type === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          <div className="text-center text-sm font-medium text-muted-foreground">
            {type === 'login' ? (
              <>
                New to GetStuffed?{' '}
                <Button variant="link" className="p-0 h-auto font-black text-primary hover:text-primary/80" onClick={() => router.push('/auth/signup')}>
                  Sign Up Free
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto font-black text-primary hover:text-primary/80" onClick={() => router.push('/auth/login')}>
                  Sign In
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

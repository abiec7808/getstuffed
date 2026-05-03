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
          },
        })
        if (error) throw error
        toast.success('Signup successful! Please check your email for verification.')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-2 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="space-y-1 text-center bg-primary/5 pb-8 pt-10">
        <div className="flex justify-center mb-4">
          {/* Logo Placeholder - Will be replaced by actual logo in page */}
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform rotate-3">
            GS
          </div>
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">
          {type === 'login' ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {type === 'login' 
            ? 'Enter your credentials to access your dashboard' 
            : 'Sign up to start managing your invoices and estimates'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="grid gap-6 py-8">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-2 focus-visible:ring-primary"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-2 focus-visible:ring-primary"
            />
          </div>
          {type === 'login' && (
            <div className="flex items-center justify-between">
              <Button variant="link" className="px-0 font-medium text-primary" type="button">
                Forgot password?
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-10">
          <Button 
            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : type === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {type === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button variant="link" className="p-0 h-auto font-bold text-primary" onClick={() => router.push('/auth/signup')}>
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto font-bold text-primary" onClick={() => router.push('/auth/login')}>
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

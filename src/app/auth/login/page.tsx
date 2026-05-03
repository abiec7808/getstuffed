import { AuthForm } from '@/components/auth-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4">
      <AuthForm type="login" />
    </div>
  )
}

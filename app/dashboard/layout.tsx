import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('supervisor-session')
  
  if (!sessionCookie) {
    redirect('/login')
  }

  let supervisor = { name: 'Supervisor', email: '' }
  try {
    supervisor = JSON.parse(sessionCookie.value)
  } catch {}

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav supervisorName={supervisor.name} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

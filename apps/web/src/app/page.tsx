import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kin2/ui';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K2</span>
            </div>
            <h1 className="text-xl font-bold">Kin2 Workforce</h1>
          </div>
          <div>
            <SignedOut>
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Workforce Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline jobs, shifts, timesheets, and payments with our production-ready platform featuring Stripe Connect, compliance reporting, and RBAC.
          </p>
          <SignedOut>
            <SignInButton>
              <Button size="lg" className="mr-4">
                Get Started
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          </SignedIn>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📋 Job Management
              </CardTitle>
              <CardDescription>
                Create, assign, and track jobs with status workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CRUD operations with validation</li>
                <li>• Status tracking & workflows</li>
                <li>• Role-based access control</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                💰 Payments & Connect
              </CardTitle>
              <CardDescription>
                Stripe Connect integration with automated payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Connect account creation</li>
                <li>• Automated payout flows</li>
                <li>• Webhook handling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📊 Compliance & Reports
              </CardTitle>
              <CardDescription>
                HMRC-style reporting with CSV/PDF exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automated CSV exports</li>
                <li>• PDF payslip generation</li>
                <li>• Audit logs & compliance</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Production Ready Features
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Next.js 14 App Router</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">TypeScript</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Prisma ORM</span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">Stripe Connect</span>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">Clerk Auth</span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Turbo Monorepo</span>
          </div>
        </div>
      </main>
    </div>
  );
}
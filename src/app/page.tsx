import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🎲 Monopoly Event
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Join the exciting interactive Monopoly event with real-time dice rolling, 
            team competition, and dynamic question challenges!
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Team Registration" 
            subtitle="Register your team and join the game"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">👥</div>
            <p className="text-gray-600 text-sm">
              Create your team, select a venue, and get ready to compete in the Monopoly event.
            </p>
            <Link href="/register">
              <Button className="w-full">Register Team</Button>
            </Link>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Play Game" 
            subtitle="Join the live game session"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">🎮</div>
            <p className="text-gray-600 text-sm">
              Watch dice rolls, answer questions, and compete with other teams in real-time.
            </p>
            <Link href="/play">
              <Button className="w-full">Start Playing</Button>
            </Link>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Admin Panel" 
            subtitle="Manage the event and control the game"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">⚙️</div>
            <p className="text-gray-600 text-sm">
              Control dice rolls, manage questions, evaluate answers, and oversee the competition.
            </p>
            <Link href="/admin">
              <Button className="w-full">Admin Access</Button>
            </Link>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Seed Data" 
            subtitle="Initialize sample data"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">🌱</div>
            <p className="text-gray-600 text-sm">
              Add sample venues and questions to get started with the event setup.
            </p>
            <Link href="/seed">
              <Button className="w-full">Seed Data</Button>
            </Link>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Debug Tools" 
            subtitle="Troubleshoot and configure"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">🔧</div>
            <p className="text-gray-600 text-sm">
              Configure Firebase settings and debug connection issues.
            </p>
            <Link href="/debug">
              <Button className="w-full">Debug Panel</Button>
            </Link>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader 
            title="Game Rules" 
            subtitle="How to play and win"
          />
          <div className="space-y-4">
            <div className="text-center text-4xl mb-4">📋</div>
            <p className="text-gray-600 text-sm">
              Learn about the game mechanics, scoring system, and competition rules.
            </p>
            <Button className="w-full" variant="secondary">View Rules</Button>
          </div>
        </Card>
      </div>

      {/* Features Section */}
      <Card>
        <CardHeader 
          title="Game Features" 
          subtitle="What makes this Monopoly event special"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="text-2xl mb-2">🎲</div>
            <div className="font-semibold text-blue-900">Real-time Dice</div>
            <div className="text-sm text-blue-700">Live dice rolling with animations</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="font-semibold text-emerald-900">Timed Challenges</div>
            <div className="text-sm text-emerald-700">Quick thinking under pressure</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-semibold text-amber-900">Team Competition</div>
            <div className="text-sm text-amber-700">Compete with other teams</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-semibold text-purple-900">Currency System</div>
            <div className="text-sm text-purple-700">Earn and manage your wealth</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

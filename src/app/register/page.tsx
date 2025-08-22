"use client";
import { useEffect, useState } from "react";
import { registerTeam, refs } from "@/lib/db";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [teamName, setTeamName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocs(collection(getDb(), "venues")).then((snap) => {
      setVenues(snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name })));
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) { 
      setError("Please enter a team name."); 
      return; 
    }
    if (!venueId) { 
      setError("Please select a venue."); 
      return; 
    }
    setLoading(true);
    setError("");
    
    try {
      // Ensure authenticated (anonymous) for Firestore rules
      await getFirebaseAuth();
      const team = await registerTeam(teamName.trim(), venueId);
      setSession({ teamId: team.id, teamName: team.name, venueId });
      router.push("/play");
    } catch (err) {
      setError("Failed to register team. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Team Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Join the Monopoly event and start your adventure!
          </p>
        </div>

        <Card variant="elevated">
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <Notice type="error" className="animate-slide-in">
                  {error}
                </Notice>
              )}

              <Input 
                label="Team Name" 
                value={teamName} 
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. The Tycoons, Property Kings"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                helperText="Choose a creative name for your team"
              />

              <Select 
                label="Venue" 
                value={venueId} 
                onChange={(e) => { 
                  setVenueId(e.target.value); 
                  if (error) setError(""); 
                }}
              >
                <option value="">Select a venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>

              {venueId && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Selected venue: <span className="font-medium">{venues.find(v => v.id === venueId)?.name}</span>
                    </span>
                  </div>
                </div>
              )}

              {!venues.length && (
                <Notice type="warn">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>No venues available. Visit the seed page to add sample venues.</span>
                  </div>
                </Notice>
              )}

              <Button 
                disabled={loading || !venueId || !teamName.trim()} 
                loading={loading}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? "Creating Team..." : "Register & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Quick Setup</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Secure</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



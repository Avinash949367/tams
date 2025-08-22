"use client";
import { useEffect, useState } from "react";
import { registerTeam, refs } from "@/lib/db";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { Card, CardHeader } from "@/components/ui/Card";
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
    if (!teamName) { setError("Enter a team name."); return; }
    if (!venueId) { setError("Please select a venue."); return; }
    setLoading(true);
    // Ensure authenticated (anonymous) for Firestore rules
    await getFirebaseAuth();
    const team = await registerTeam(teamName, venueId);
    setSession({ teamId: team.id, teamName: team.name, venueId });
    router.push("/play");
  }

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card>
          <CardHeader title="Team Registration" />
          <div className="space-y-4">
            {error && <Notice type="error">{error}</Notice>}
            <Input label="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Tycoons" />
            <Select label="Venue" value={venueId} onChange={(e) => { setVenueId(e.target.value); setError(""); }}>
              <option value="">Select venue</option>
              {venues.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
            </Select>
            {venueId && (
              <div className="text-xs text-gray-600">Selected venue: <span className="font-medium">{venues.find(v => v.id === venueId)?.name}</span></div>
            )}
            {!venues.length && (
              <Notice type="warn">No venues yet. Visit /seed to add sample venues.</Notice>
            )}
            <Button disabled={loading || !venueId} className="w-full">
              {loading ? "Registering..." : "Register & Continue"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}



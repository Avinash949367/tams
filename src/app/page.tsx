export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-3xl font-bold">Monopoly Event</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/register" className="border rounded-xl p-6 hover:bg-gray-50">
            <div className="text-lg font-semibold">Register Team</div>
            <p className="text-sm text-gray-600">Join a venue to play.</p>
          </a>
          <a href="/admin" className="border rounded-xl p-6 hover:bg-gray-50">
            <div className="text-lg font-semibold">Admin Panel</div>
            <p className="text-sm text-gray-600">Control rolls and evaluation.</p>
          </a>
          <a href="/play" className="border rounded-xl p-6 hover:bg-gray-50">
            <div className="text-lg font-semibold">Play</div>
            <p className="text-sm text-gray-600">Wait for the roll and answer.</p>
          </a>
          <a href="/seed" className="border rounded-xl p-6 hover:bg-gray-50">
            <div className="text-lg font-semibold">Seed Data</div>
            <p className="text-sm text-gray-600">Add venues and questions.</p>
          </a>
        </div>
      </div>
    </div>
  );
}

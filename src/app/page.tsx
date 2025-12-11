export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-8">
      <h1 className="text-4xl font-display font-bold text-blue-700 mb-4">
        🎉 CSS Errors Fixed!
      </h1>
      <p className="text-gray-600 mb-8">
        All CSS warnings should be gone now.
      </p>
      <div className="space-y-4 max-w-md">
        <div className="p-4 bg-blue-500 text-white rounded-lg animate-fade-in">
          Blue Color Test
        </div>
        <div className="p-4 bg-teal-500 text-white rounded-lg animate-slide-up">
          Teal Color Test
        </div>
        <button className="btn-primary w-full">
          Primary Button Test
        </button>
        <button className="btn-secondary w-full">
          Secondary Button Test
        </button>
        <div className="card p-4">
          <h3 className="font-semibold text-lg mb-2">Card Component</h3>
          <p className="text-gray-600">This is a card with hover effects.</p>
        </div>
      </div>
    </div>
  )
}
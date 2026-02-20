export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-6 py-8">
      
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm text-gray-400">Delivering to Koramangala</p>
        <h1 className="text-3xl font-semibold mt-2">
          Good Morning, Kunal.
        </h1>
        <p className="text-gray-400 mt-1">
          Your essentials. <span className="text-[#FF8A00] font-medium">Delivered within 60 minutes.</span>
        </p>
      </div>

      {/* Smart Reorder */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Reorder in 1 Tap</h2>
        <div className="grid grid-cols-3 gap-4">
          {["Protein Shake", "Face Wash", "Coffee Pods"].map((item) => (
            <div
              key={item}
              className="bg-[#1F2937] rounded-2xl p-4 hover:scale-105 transition-transform duration-200"
            >
              <div className="h-20 bg-gray-700 rounded-xl mb-3"></div>
              <p className="text-sm">{item}</p>
              <p className="text-xs text-gray-400 mt-1">
                Based on your weekly pattern
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Brands */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Featured Today</h2>
        <div className="grid grid-cols-2 gap-4">
          {["Minimalist", "The Whole Truth", "Sleepy Owl", "Kapiva"].map(
            (brand) => (
              <div
                key={brand}
                className="bg-[#1F2937] rounded-2xl p-6 hover:scale-105 transition-transform duration-200"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">{brand}</p>
                  <span className="text-xs bg-[#FF8A00] px-2 py-1 rounded-full">
                    60 min
                  </span>
                </div>
                <div className="h-20 bg-gray-700 rounded-xl mt-4"></div>
              </div>
            )
          )}
        </div>
      </div>

      {/* AI Picks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Picked for You</h2>
        <div className="bg-[#1F2937] rounded-2xl p-6">
          <p className="text-sm">
            🧠 Evening demand spike detected in your area.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Consider restocking hydration essentials.
          </p>
        </div>
      </div>
    </div>
  );
}

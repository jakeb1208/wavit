export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">About Velora</h1>
          <p className="text-gray-500">Smarter Waiting Starts Here</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <p className="text-gray-600 leading-relaxed text-base">
              We believe waiting shouldn't feel like wasting time. Our platform helps 
              businesses manage their lines more efficiently while giving customers a 
              better, more transparent experience. Instead of standing around or guessing 
              how long it'll take, customers can see real-time wait times and plan their 
              time better.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Why We Built This</h2>
            <p className="text-gray-600 leading-relaxed">
              We noticed a simple problem: waiting rooms and lines are outdated. 
              Restaurants, barbershops, and other local businesses often rely on manual 
              systems that create confusion, long waits, and missed opportunities. So we 
              built a solution that brings waiting into the modern world.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">What We Do</h2>
            <p className="text-gray-600 leading-relaxed">
              We allow customers to view live wait times and their position in line to 
              better plan their time. At the same time, we provide businesses with 
              insights into peak hours and demand while helping reduce overcrowding and 
              improve overall customer flow.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To eliminate unnecessary waiting and make every minute more productive — for 
              both customers and businesses.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Who It's For</h2>
            <p className="text-gray-600 leading-relaxed">
              Whether you're grabbing a quick haircut, waiting for a table, or running a 
              busy local business, our platform is designed to make the experience smoother, 
              faster, and smarter.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Looking Ahead</h2>
            <p className="text-gray-600 leading-relaxed">
              We're just getting started. Our goal is to expand into more industries, add 
              smarter predictions, and continue improving how people experience waiting — 
              so eventually, waiting won't feel like waiting at all.
            </p>
          </section>

          <p className="text-center text-sm text-gray-400 pt-4">
            Built to make time work better.
          </p>
        </div>
      </div>
    </div>
  );
}

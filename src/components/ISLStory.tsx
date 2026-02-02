export function ISLStory() {
  return (
    <section className="py-20 bg-[#E8E8E8]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Section Label */}
        <div className="mb-12">
          <div className="w-16 h-1 bg-[#D6C8B0] mb-6"></div>
          <h3 className="text-[#0A1A2F] mb-8">The Story</h3>
        </div>

        {/* Story Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            A few months ago, I was walking along the south shore, looking at a stunning property that had been sitting on the market for 180 days.
          </p>
          
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            On paper, it was perfect. Cathedral ceilings, a chef's kitchen, and that unmistakable Gray Lady charm. But it was "burning" on the MLS. Every day it sat there, the perceived value dropped by thousands.
          </p>
          
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            I realized then that the old way of selling a home on-island—sticking a sign in the yard and waiting for a summer visitor to fall in love—is officially dead.
          </p>

          {/* Pull Quote */}
          <div className="my-12 pl-8 border-l-4 border-[#3A5C7E]">
            <blockquote className="text-2xl italic text-[#0A1A2F] leading-relaxed">
              There is a new, invisible barrier preventing high-net-worth buyers from pulling the trigger, and most brokers are completely ignoring it.
            </blockquote>
          </div>
        </div>

        {/* Image */}
        <div className="mt-12 rounded-sm overflow-hidden border border-[#D6C8B0]">
          <img
            src="https://images.unsplash.com/photo-1724230759479-32b57f30ba86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBlbXB0eSUyMGhvbWUlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzAwNjE1MzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury home interior"
            className="w-full h-96 object-cover"
          />
        </div>
      </div>
    </section>
  );
}

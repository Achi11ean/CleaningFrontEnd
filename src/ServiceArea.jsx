import React from "react";

const CITIES = [
  "Avon",
  "Berlin",
  "Bristol",
  "Canton",
  "Farmington",
  "Harwinton",
  "Middlebury",
  "New Britain",
  "Plainville",
  "Simsbury",
  "Southington",
  "Terryville",
  "Thomaston",
  "Waterbury",
  "Watertown",
  "West Hartford",
  "Wolcott",
];

const ServiceArea = () => {
  return (
    <section className="relative bg-gradient-to-b from-black via-gray-900 to-black py-12 text-gray-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 text-center">
        {/* Header */}
        <h2 className="text-3xl sm:text-5xl font-serif font-extrabold text-blue-400 drop-shadow mb-4 uppercase tracking-wide border-b-2 border-blue-500 pb-2 inline-block">
          Our Service Area
        </h2>

        <p className="text-lg sm:text-xl text-gray-300 mb-8">
          We proudly serve homes and businesses within{" "}
          <span className="text-blue-400 font-semibold">30 miles</span> of{" "}
          <strong className="text-white">Bristol, CT</strong>
        </p>

        {/* Cities List */}
        <div className="relative mb-10">
          {/* Mobile scroll hint */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black to-transparent sm:hidden" />

          <div
            className="
              flex gap-3 overflow-x-auto pb-3 px-1
              sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible
              scrollbar-thin scrollbar-thumb-blue-600/40 scrollbar-track-transparent
            "
          >
            {CITIES.map((city) => (
              <div
                key={city}
                className="
                  flex-shrink-0
                  px-5 py-2.5
                  rounded-full
                  bg-white/5 backdrop-blur
                  border border-white/10
                  text-sm sm:text-base font-semibold
                  text-gray-100
                  hover:border-blue-400 hover:text-blue-300
                  transition
                "
              >
                {city}
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="relative p-2 sm:p-4 rounded-2xl shadow-2xl border border-blue-600 bg-gradient-to-b from-gray-950 to-black">
          <iframe
            title="Service Area Map - Bristol CT"
            src="https://www.google.com/maps?q=41.6718,-72.9493&z=11&output=embed"
            width="100%"
            height="450"
            style={{ borderRadius: "1rem", border: "none" }}
            className="w-full"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-sm italic text-gray-400">
          Not sure if you’re in the zone? Reach out and we’ll see if we can fit you in 💌
        </p>
      </div>
    </section>
  );
};

export default ServiceArea;

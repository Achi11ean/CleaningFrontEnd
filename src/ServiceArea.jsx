import React from "react";

const ServiceArea = () => {
  return (
    <section className="relative bg-gradient-to-b from-black via-gray-900 to-black py-12 text-gray-100 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Header */}
        <h2 className="text-3xl font-serif sm:text-5xl font-extrabold text-blue-400 drop-shadow mb-6 uppercase tracking-wide border-b-2 border-blue-500 pb-2 inline-block">
          Our Service Area
        </h2>

        {/* Label + Select */}
        <div className="mb-8">
          <label
            htmlFor="town-select"
            className="block text-lg sm:text-xl font-medium text-gray-300 mb-4"
          >
            We serve homes and businesses within{" "}
            <span className="text-blue-400 font-semibold">30 miles</span> of{" "}
            <strong className="text-white">Bristol, CT</strong>
          </label>
          <select
            id="town-select"
            name="town"
            className="w-full sm:w-[75%] mx-auto block bg-gradient-to-r from-gray-900 to-black border border-blue-500 text-gray-200 text-lg font-semibold rounded-full shadow-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">-- Towns/Cities --</option>
            <option value="Avon">Avon</option>
            <option value="Bristol">Bristol</option>
            <option value="Canton">Canton</option>
            <option value="Farmington">Farmington</option>
            <option value="Plainville">Plainville</option>
            <option value="New Britain">New Britain</option>
            <option value="Terryville">Terryville</option>
            <option value="Southington">Southington</option>
            <option value="Wolcott">Wolcott</option>
            <option value="Waterbury">Waterbury</option>
            <option value="Middlebury">Middlebury</option>
            <option value="Harwinton">Harwinton</option>
            <option value="Thomaston">Thomaston</option>
            <option value="West Hartford">West Hartford</option>
            <option value="Simsbury">Simsbury</option>
            <option value="Berlin">Berlin</option>
            <option value="Watertown">Watertown</option>
          </select>
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
          ></iframe>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-sm italic text-gray-400">
          Not sure if you’re in the zone? Reach out and we’ll see if we can fit you in! 💌
        </p>
      </div>
    </section>
  );
};

export default ServiceArea;

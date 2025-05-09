import React from "react";

const ServiceArea = () => {
  return (
    <section className="relative bg-gradient-to-b from-white via-blue-50 to-blue-200 py-6 text-gray-800 overflow-hidden">
      <div className="max-w-4xl mx-auto px-2 text-center">
        <h2 className="text-2xl border-2 border-blue-500 p-1 rounded-2xl sm:text-4xl font-extrabold text-blue-700 drop-shadow-md mb-4 animate-fade-in">
           Our Service Area
        </h2>

        <div className="mb-2">
          <label
            htmlFor="town-select"
            className="block text-lg sm:text-xl font-medium text-gray-700 mb-2"
          >
            We serve homes and businesses within{" "}
            <span className="text-blue-600 font-semibold">20 miles</span> of{" "}
            <strong>Bristol, CT</strong>
          </label>
          <select
            id="town-select"
            name="town"
            className="w-full text-center sm:w-[75%]  block bg-white border border-blue-400 text-gray-700 text-lg font-semibold rounded-full shadow-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

        <div className="relative p-2 sm:p-4 rounded-3xl shadow-xl border-4 border-blue-400 bg-white/90 backdrop-blur-sm">
          <iframe
            title="Service Area Map - Bristol CT"
            src="https://www.google.com/maps?q=41.6718,-72.9493&z=11&output=embed"
            width="100%"
            height="450"
            style={{ borderRadius: "1.5rem", border: "none" }}
            className="w-full"
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>

        <p className="mt-6 text-sm italic text-black">
          Not sure if you’re in the zone? Reach out and we’ll see if we can fit you in! 💌
        </p>
      </div>
    </section>
  );
};

export default ServiceArea;

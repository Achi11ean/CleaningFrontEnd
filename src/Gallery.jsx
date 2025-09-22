import React, { useState } from "react";

const Gallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // ✅ Static gallery images
  const photos = [
    { id: 1, image_url: "/slider1.jpeg", caption: "Fresh Start", category: "Residential" },
    { id: 2, image_url: "/slider2.jpeg", caption: "Sparkling Kitchen", category: "Kitchen" },
    { id: 3, image_url: "/slider3.jpeg", caption: "Relaxed Living", category: "Living Room" },
    { id: 4, image_url: "/slider4.jpeg", caption: "Fresh Bathroom", category: "Bathroom" },
    { id: 5, image_url: "/slider5.jpeg", caption: "Kitchen", category: "Floors" },
    { id: 6, image_url: "/slider6.jpeg", caption: "Office Care", category: "Commercial" },
    { id: 7, image_url: "/slider7.jpeg", caption: "Faucets", category: "Stainless Steel" },
    { id: 8, image_url: "/slider8.jpeg", caption: "Showers", category: "Green Clean" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black overflow-hidden text-gray-100">
      {/* Title */}
      <div className="relative z-10 py-12 mt-12  text-center">
        <h1 className="text-4xl border-b-4 border-yellow-400 pb-4 sm:text-5xl md:text-6xl font-extrabold drop-shadow-lg text-blue-400 animate-fade-in">
          ✨ Photo Gallery ✨
        </h1>
        <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">
          A showcase of our residential, commercial, and eco-friendly cleaning services.
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-6 pb-16">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded border-2 overflow-hidden shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-blue-500/30 cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.image_url}
              alt={photo.caption}
              className="w-full h-56 object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500 flex items-end justify-start p-4">
              <div>
                <p className="text-lg font-bold text-white">{photo.caption}</p>
                <p className="text-sm text-blue-300">{photo.category}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 px-4">
          <div className="relative max-w-4xl w-full bg-gradient-to-b from-slate-800 to-black rounded-lg shadow-2xl p-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-3xl font-bold"
            >
              ×
            </button>

            <div className="flex flex-col items-center">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption}
                className="w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-blue-400">{selectedPhoto.caption}</h2>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;

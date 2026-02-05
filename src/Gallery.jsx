import React, { useEffect, useState } from "react";
import axios from "axios";

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://cleaningback.onrender.com/gallery/public")
      .then((res) => {
        setPhotos(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load gallery", err);
      })
      .finally(() => setLoading(false));
  }, []);

 return (
  <div className="relative min-h-screen bg-gradient-to-b from-[#0b0f14] via-[#0f172a] to-black text-gray-100 overflow-hidden">

    {/* Decorative glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 blur-[160px]" />
    </div>

    {/* HERO */}
    <section className="relative pt-32 pb-20 px-6 text-center">
      <span className="uppercase tracking-[0.35em] text-xs text-cyan-300/70">
        Portfolio
      </span>

      <h1 className="
        mt-6 text-4xl sm:text-5xl md:text-6xl xl:text-7xl
        font-extrabold tracking-tight
        bg-gradient-to-br from-white via-slate-200 to-cyan-300
        text-transparent bg-clip-text
      ">
        Our Cleaning Gallery
      </h1>

      <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed">
        A curated collection of real spaces we’ve transformed —  
        crafted with precision, care, and uncompromising attention to detail.
      </p>

      <div className="mt-10 flex justify-center">
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>
    </section>

    {/* STATES */}
    {loading && (
      <div className="text-center text-gray-400 py-24 text-lg tracking-wide">
        Loading gallery…
      </div>
    )}

    {!loading && photos.length === 0 && (
      <div className="text-center text-gray-400 py-24 text-lg tracking-wide">
        No gallery images yet.
      </div>
    )}

    {/* GALLERY */}
    <section className="relative max-w-[90rem] mx-auto px-6 pb-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {photos.map((photo) => (
          <article
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="
              group cursor-pointer
              relative overflow-hidden
              rounded-[28px]
              bg-white/5
              border border-white/10
              shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              transition-all duration-500
              hover:-translate-y-1 hover:shadow-cyan-400/20
            "
          >
            {/* Image */}
            <img
              src={photo.image_url}
              alt={photo.title}
              loading="lazy"
              className="
                w-full h-[18rem] object-cover
                transition-transform duration-[900ms] ease-out
                group-hover:scale-[1.05]
              "
            />

            {/* Fade overlay */}
            <div className="
              absolute inset-0
              bg-gradient-to-t from-black/90 via-black/30 to-transparent
              opacity-0 group-hover:opacity-100
              transition-opacity duration-500
              flex items-end
            ">
              <div className="p-6">
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {photo.title}
                </h3>

                {photo.description && (
                  <p className="mt-2 text-sm text-gray-300 leading-snug line-clamp-2">
                    {photo.description}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    {/* MODAL */}
    {selectedPhoto && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center px-6">
        <div className="
          relative w-full max-w-6xl
          rounded-[32px]
          bg-gradient-to-b from-[#0f172a] to-black
          border border-white/10
          shadow-[0_40px_120px_rgba(0,0,0,0.85)]
          overflow-hidden
        ">
          {/* Close */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="
              absolute top-2 bg-red-700 rounded-full right-6 z-10
              text-white/60 hover:text-white
              text-4xl font-light
              transition px-1
            "
          >
            ×
          </button>

          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            <div className="lg:w-2/3 bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="max-h-[85vh] w-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="lg:w-1/3 p-10 flex flex-col justify-center">
              <span className="uppercase text-xs tracking-widest text-cyan-300/70">
                Gallery Entry
              </span>

              <h2 className="mt-4 text-3xl xl:text-4xl font-extrabold tracking-tight text-white">
                {selectedPhoto.title}
              </h2>

              <div className="mt-6 h-px w-16 bg-gradient-to-r from-cyan-400/60 to-transparent" />

              {selectedPhoto.description && (
                <p className="mt-6 text-gray-300 text-base leading-relaxed">
                  {selectedPhoto.description}
                </p>
              )}

              <p className="mt-10 text-xs tracking-wider uppercase text-gray-500">
                Added {new Date(selectedPhoto.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default Gallery;

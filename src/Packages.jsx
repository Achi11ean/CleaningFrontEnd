import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Tailwind CSS

const Packages = () => {


  const photographyPackages = [
    {
      id: 1,
      title: "Portrait Package",
      price: "$99",
      description:
        "Capture stunning personal portraits with professional lighting and creative backgrounds. Includes 1-hour studio session, up to 10 professionally edited photos, and access to digital downloads.",
      image: "https://4kwallpapers.com/images/wallpapers/beautiful-girl-beautiful-woman-portrait-black-background-3840x2160-2937.jpg", // Replace with real image
    },
    {
      id: 2,
      title: "Event Package",
      price: "$299",
      description:
        "Perfect for weddings, birthdays, and special events. Includes full-day coverage (up to 8 hours), 50+ edited photos, candid and group shots, and a personal online gallery.",
      image: "https://i.ytimg.com/vi/o5hGwH86VDA/maxresdefault.jpg",
    },
    {
      id: 3,
      title: "Family Package",
      price: "$199",
      description:
        "Create timeless memories with your loved ones. Includes a 1.5-hour outdoor or indoor session, group and individual shots, 20+ edited photos, and high-resolution downloads.",
      image: "https://www.shutterstock.com/shutterstock/videos/1097782199/thumb/1.jpg?ip=x480",
    },
    {
      id: 4,
      title: "Couples Package",
      price: "$149",
      description:
        "Celebrate your love story with a professional couples photoshoot. Includes 1-hour session at a location of your choice, 15 edited romantic shots, and a print-ready gallery.",
      image: "https://wallpapercat.com/w/full/8/9/2/927542-3840x2160-desktop-4k-love-couple-background-photo.jpg",
    },
    {
      id: 5,
      title: "Pet Package",
      price: "$89",
      description:
        "Adorable photos of your furry friends! Includes 45-minute session, playful and candid shots, 10 edited images, and optional themed props for added fun.",
      image: "https://wallpapershome.com/images/pages/ico_h/1061.jpg",
    },
    {
      id: 6,
      title: "Holiday Package",
      price: "$129",
      description:
        "Seasonal-themed photoshoots for holidays like Christmas, Easter, or special occasions. Includes 1-hour session, 20 festive-themed photos, and customizable props/backdrops.",
      image: "https://img.freepik.com/premium-photo/festive-family-photo-front-christmas-tree-with-everyone-dressed-holiday-attire-smiling-embracing-joy-season-4k-hyperrealistic-photo_1165781-16344.jpg",
    },
  ];

  const gradientClasses = [
    "from-yellow-300 to-yellow-500",
    "from-pink-300 to-pink-500",
    "from-green-300 to-green-500",
    "from-blue-300 to-blue-500",
    "from-purple-300 to-purple-500",
    "from-red-300 to-red-500",
  ];


  

  return (
<div className="w-full min-h-screen bg-gradient-to-b from-gray-100 via-gray-300 to-gray-900 text-gray-800">
{/* Header */}
<header className="relative bg-transparent text-gray-900 text-center py-16">
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('banner.webp')" }}
  ></div>

  {/* Subtle Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-transparent"></div>

  {/* Content */}
  <div className="relative z-10 text-white">
    <h1 className="text-6xl font-bold tracking-wide">Explore The Golden Packages</h1>
    <p className="mt-4 text-2xl font-bold mx-auto">
      Professional and personalized photography services to capture your story.
    </p>
    <Link
  to="/contact"
  className="mt-6 inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
  text-white font-extrabold text-lg px-10 py-4 rounded-full shadow-2xl 
  hover:from-yellow-500 hover:via-red-400 hover:to-pink-500 
  transform hover:scale-110 transition-all duration-300 ease-out"
>
  Book Now
</Link>

  </div>
</header>



      {/* Package Cards */}
      <section className="py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photographyPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`bg-gradient-to-br ${gradientClasses[index % gradientClasses.length]} text-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105`}
            >
              {/* Image */}
              {pkg.image && (
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-48 object-cover"
                />
              )}
              {/* Content */}
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">{pkg.title}</h2>
                <p className="text-2xl font-semibold mb-3">{pkg.price}</p>
                <p className="text-gray-100 font-bold text-xl mb-4">{pkg.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Single "Book Now" Button */}
  
      </section>



    </div>
  );
};

export default Packages;

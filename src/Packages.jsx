import React, { useState } from "react";
import { Link } from "react-router-dom";

const Packages = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);

  const handleViewPackage = (pkg) => setSelectedPackage(pkg);
  const closeModal = () => setSelectedPackage(null);

  // ✅ Full static packages list
  const packages = [
        {
      id: 3,
      title: "One-Time Deep Clean",
      description: `✨ Perfect for seasonal resets or special occasions.
Our Deep Clean covers every nook and cranny for a total refresh:
• Cleaning under & behind appliances (where accessible)
• Moving light furniture to clean behind/underneath
• Interior windows + tracks & sills
• Upholstery vacuuming (sofas, chairs, cushions)
• Detailed baseboard & trim cleaning throughout
• Doors, frames, light switches & vents detailed
• Bathrooms & kitchen scrubbed top to bottom
• Floors vacuumed & mopped with safe, effective solutions

💲 Starting at $475`,
    },
    {
      id: 1,
      title: "Recurring Maintenance Cleaning",
      description: `A consistently clean home, without the stress.
Keep your home fresh and inviting week after week. Every new client begins with an Initial Deep Clean to set the standard. After that, choose the maintenance plan that fits your lifestyle.

Standard Package
• Dusting of accessible surfaces, décor, blinds, fans
• Vacuuming & mopping of all floors
• Kitchen: counters, sinks, cabinet fronts, appliance exteriors, backsplash
• Bathrooms: toilets, tubs, showers, sinks, mirrors, fixtures
• Bedrooms: bed making, surface wipe-downs
• Trash removal & disinfecting high-touch points

💲 Starting at $225 per visit`,
    },
    {
      id: 2,
      title: "Premium Package",
      description: `Everything in Standard, plus:
• Baseboards & trim wiped
• Doors, frames & light switches detailed
• Interior windows (dusting and glass wiping only)
• Upholstery vacuumed
• Bed linens changed (when provided)

💲 Starting at $300 per visit`,
    },

    {
      id: 4,
      title: "Move-In / Move-Out Clean",
      description: `🚚 Leave it spotless or start fresh in your new home.
Our most detailed package ensures your space is move-ready:
• Inside & outside of appliances (fridge, oven, microwave, dishwasher, etc.)
• Inside & outside of cabinetry & drawers in every room
• Walls, doors, trim & baseboards washed down
• Interior windows + tracks & sills cleaned
• Drains cleaned & deodorized
• Vent covers, fans & light fixtures dusted
• Floors vacuumed, mopped, & polished
• Every corner detailed — so you or the next resident walk into a home that feels brand new

💲 Starting at $625`,
    },
    {
      id: 5,
      title: "Kitchen & Bath Package",
      description: `🍽️ Focus on the most-used spaces in your home.
• Kitchen: counters, backsplash, sinks & drains, cabinet fronts, appliance exteriors, floors
• Bathrooms: toilets, tubs, showers, sinks, mirrors, fixtures, tile & grout, floors
• Fixtures polished & disinfected
• High-touch areas sanitized

💲 Starting at $225`,
    },
    {
      id: 6,
      title: "Kitchen Appliance Cleaning Package",
      description: `🍳 Restore shine & extend the life of your appliances.
• Interior & exterior cleaning of fridge, oven, microwave, dishwasher
• Grease, spills, & buildup removed with safe solutions
• Fresh, sanitized appliances that perform better

💲 Starting at $250`,
    },
    {
      id: 7,
      title: "Small Appliance Cleaning Package",
      description: `☕ Everyday essentials, refreshed.
• Coffee makers & espresso machines (descaling & sanitizing)
• Toasters, toaster ovens & air fryers
• Blenders, juicers, or mixers
• Ice makers & other small appliances

💲 Starting at $50`,
    },
    {
      id: 8,
      title: "Detailed Window Cleaning",
      description: `🪟 Let the light shine in.
• Interior glass panes cleaned streak-free
• Locks, frames, latches polished
• Tracks & sills deep cleaned
• Optional: safe ground-level exterior cleaning

💲 Starting at $250`,
    },
    {
      id: 9,
      title: "Post-Construction Cleaning",
      description: `🏗️ From dusty to dazzling.
• Fine dust removal from ceilings, walls, vents, fixtures
• Cabinets, drawers & shelves cleaned inside & out
• Baseboards, doors, trim polished
• Windows, tracks & sills cleaned
• Floors vacuumed, mopped & detailed
• Safe disposal of small construction debris

💲 Starting at $650`,
    },
    {
      id: 10,
      title: "VIP Membership Packages",
      description: `🌿 Our most exclusive offering — for clients who want premium care, savings & peace of mind.
Choose 3, 6, or 12 months prepaid and enjoy:
• Complimentary add-ons (like fridge interiors, linen changes, oven cleaning, window refreshes)
• Discounts on total service cost (greater savings for 6 & 12 months)
• Priority scheduling — your appointments come first
• A consistent cleaning team you can trust

💲 Starting at $225 per cleaning`,
    },
    {
      id: 11,
      title: "Commercial Cleaning Package",
      description: `✨ Reliable, eco-friendly cleaning tailored to your business.
• Desks, counters & high-touch surfaces disinfected
• Restrooms sanitized (toilets, sinks, mirrors, fixtures, floors)
• Breakroom/kitchenette cleaned (counters, sinks, appliances, cabinet fronts)
• Trash emptied & liners replaced
• Floors vacuumed & mopped
• Interior glass & partitions cleaned
• Rotating deep-cleaning available (vents, upholstery, appliances, etc.)

💲 Starting at $250 per visit`,
    },
  ];

  return (
    <div className="w-full min-h-screen pt-6 bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      {/* Header */}
      <br/><br/>
      <header className="text-center mt-6 mb-2   border-b border-blue-500">
        <h1
          className="text-5xl border-b-2 sm:text-6xl font-extrabold uppercase tracking-wide text-blue-400 drop-shadow-lg"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Cleaning Packages
        </h1>
        <p className=" max-w-3xl mx-auto mb-4 text-md shadow-md shadow-white sm:text-xl font-medium bg-gradient-to-r from-blue-600/20 to-black/30 px-6 py-4  shadow-md border border-blue-700/40">
          Premium Eco-Friendly Home & Business Cleaning <br/> <br/>
          Using only EWG-rated A or higher, non-toxic products safe for your
          family, pets, and the planet. Our expert team delivers detailed,
          reliable cleaning tailored to your needs.
        </p>
      </header>

      {/* Package Grid */}
      <section className="px-6 mt-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleViewPackage(pkg)}
              className="relative bg-gradient-to-b from-gray-800 to-black border border-blue-600 p-6 rounded-lg shadow-xl 
                         transition-all transform hover:scale-105 hover:shadow-blue-500/30 text-left group"
            >
              <h2 className="text-2xl font-bold text-blue-400 uppercase tracking-wide mb-2 group-hover:text-white transition">
                {pkg.title}
              </h2>
              <p className="text-gray-300 line-clamp-4 text-sm">
                {pkg.description}
              </p>
              <span className="absolute bottom-3 right-4 text-sm font-semibold text-blue-400 underline group-hover:text-white transition">
                View Details
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-2 sm:px-4">
          <div className="relative bg-gradient-to-b from-gray-900 to-black border border-blue-600 shadow-2xl w-full max-w-lg sm:max-w-2xl p-6 sm:p-10 
                          max-h-[90vh] overflow-y-auto rounded-lg">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-400 text-3xl font-bold transition"
            >
              ×
            </button>

            {/* Modal Content */}
            <h2 className="text-3xl font-bold border-b-2  text-blue-400 mb-6 uppercase tracking-wider drop-shadow">
              {selectedPackage.title}
            </h2>
            <p className="text-gray-200 whitespace-pre-line leading-relaxed text-base">
              {selectedPackage.description}
            </p>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                to="/contact"
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold text-lg px-8 py-3 rounded-lg shadow-lg 
                           hover:from-blue-500 hover:to-blue-700 hover:shadow-blue-500/40 transform hover:scale-105 transition-all"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;

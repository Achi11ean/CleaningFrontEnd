import React from "react";

const FORM_URL =
  "https://www.honeybook.com/widget/_294956/cf_id/690ceb0d1a673a002c963efb";

const Contact = () => {
  const handleClick = () => {
    window.open(FORM_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-black text-gray-100 flex items-center justify-center px-4 py-12">
      <div
        onClick={handleClick}
        className="
          relative mt-12 pb-12
          bg-gradient-to-b from-gray-900 to-black
          border border-blue-600
          shadow-2xl
          w-full max-w-3xl
          p-6 sm:p-10
          rounded-lg
          cursor-pointer
          hover:border-blue-400
          hover:shadow-blue-500/30
          transition-all duration-300
        "
      >
        {/* Header */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-400 mb-6 text-center uppercase tracking-wide drop-shadow">
          Contact Us
        </h2>

        <p className="text-center text-gray-300 mb-8 text-base sm:text-lg">
          Have questions or want to schedule your next clean?
          <br />
          Click below to fill out our contact form.
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            className="
              bg-blue-600 hover:bg-blue-500
              text-white font-bold
              px-8 py-4
              rounded-lg
              shadow-lg
              text-lg
              transition-all duration-300
            "
          >
            Open Contact Form →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;

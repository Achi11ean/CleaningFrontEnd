import React, { useEffect } from "react";

const Contact = () => {
  useEffect(() => {
    // Load Jobber CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://d3ey4dbjkt2f6s.cloudfront.net/assets/external/work_request_embed.css";
    document.head.appendChild(link);

    // Load Jobber Script
    const script = document.createElement("script");
    script.src =
      "https://d3ey4dbjkt2f6s.cloudfront.net/assets/static_link/work_request_embed_snippet.js";
    script.setAttribute(
      "clienthub_id",
      "8c1aef17-435d-4cbf-8709-271f0e2e5ba9"
    );
    script.setAttribute(
      "form_url",
      "https://clienthub.getjobber.com/client_hubs/8c1aef17-435d-4cbf-8709-271f0e2e5ba9/public/work_request/embedded_work_request_form"
    );
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-700 bg-cover bg-center flex items-center justify-center px-4 py-12"
      style={{ backgroundImage: "url('cleaning8.webp')" }}
    >
      <div className="bg-gradient-to-br from-blue-200 via-blue-300 to-indigo-500 bg-opacity-90 mt-16 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-6xl w-full text-white">
        <h2 className="text-4xl border-2 rounded-3xl border-white bg-white/60 sm:text-5xl font-extrabold text-center text-gray-900 mb-6">
          Contact Us
        </h2>

        {/* Jobber Form Placeholder */}
        <div
          id="8c1aef17-435d-4cbf-8709-271f0e2e5ba9"
          className="bg-white rounded-lg shadow-lg p-4"
        ></div>
      </div>
    </div>
  );
};

export default Contact;

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
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-800 via-blue-900 to-black text-gray-100 flex items-center justify-center px-4 py-12">
      <div className="relative mt-12 pb-12 bg-gradient-to-b from-gray-900 to-black border border-blue-600 shadow-2xl w-full max-w-3xl p-6 sm:p-10 rounded-lg overflow-hidden">
        {/* Header */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-400 mb-6 text-center uppercase tracking-wide drop-shadow">
          Contact Us
        </h2>
        <p className="text-center text-gray-300 mb-8 text-base sm:text-lg">
          Have questions or want to schedule your next clean?  
          Fill out the form below and our team will get back to you shortly.
        </p>

        {/* Jobber Form Placeholder */}
        <div
          id="8c1aef17-435d-4cbf-8709-271f0e2e5ba9"
          className="bg-white text-black rounded-md shadow-lg p-4 w-full max-w-full overflow-hidden"
        ></div>
      </div>
    </div>
  );
};

export default Contact;

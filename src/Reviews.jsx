import React, { useState } from "react";

const ReviewList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  // ✅ Hard-coded reviews
  const reviews = [
    {
      id: 1,
      reviewer_name: "Rob",
      comment:
        "Amanda was great, from consultation to result, I will be calling her back again",
      rating: 5,
    },
    {
      id: 2,
      reviewer_name: "Chris B",
      comment:
        "Amanda gave me a thorough consultation, showed up on time, and cleaned my place with greater detail than expected. I highly recommend that you give her and her people a try.",
      rating: 5,
    },
    {
      id: 3,
      reviewer_name: "Kelly S",
      comment:
        "The Attention to detail blew me away! I had a deep clean done on my house and not a stone was left unturned. I am a working, homeschooling mother and wife who just doesn’t have the time to clean as much as I’d like. Treating myself to this deep clean was the best decision ever! You will not be sorry!!",
      rating: 5,
    },
    {
      id: 4,
      reviewer_name: "Carol",
      comment:
        "I have been using A Breath of Fresh Air cleaning service for nearly a year. They are courteous, professional and punctual. They come into the house in an unobtrusive manner allowing me to continue to work from home while they are here. The owner is a good communicator and is reasonable with me regarding my expectations. They are flexible to my evolving needs and offer support and suggestions whenever possible. I plan to use them as long as possible.",
      rating: 5,
    },
    {
      id: 5,
      reviewer_name: "Luis R",
      comment:
        "My cleaners were professional, thorough, and used high-quality, pet-safe cleaning products, which gave me peace of mind for my dog. Every surface was spotless, and there were no harsh chemical smells. They truly care about their clients and their pets. If you're looking for a reliable, pet-friendly cleaning service, I highly recommend them.",
      rating: 5,
    },
    {
      id: 6,
      reviewer_name: "Megan",
      comment:
        "Incredible cleaning service! The team was professional, friendly, and extremely thorough. Every corner of my home was spotless, and they went above and beyond with the details. My home feels so fresh and clean! I highly recommend them and will definitely be a repeat customer.",
      rating: 5,
    },
    {
    id: 7,
    reviewer_name: "Julia",
    comment:
      "Amanda and her team are amazing! Their attention to detail, friendliness, and professionalism is out of this world! I love when they come and look forward to it everytime! 😊 They are also great with working around animals and young children, which makes scheduling and such so much easier. I am never disappointed and my home feels lighter and happier after they come.",
    rating: 5,
  },
  {
    id: 8,
    reviewer_name: "Andrew",
    comment:
      "Amanda and her staff were phenomenal from start to finish. They started while I was working in my downstairs office. I walked upstairs a bit later to find the team almost complete! Everything was spotless and shiny - even the stainless steel appliances! Amanda was professional and thorough, as was her team. They have absolutely earned my continuing business!",
    rating: 5,
  },
  {
    id: 9,
    reviewer_name: "Bethany",
    comment:
      "They came at the last minute to clean my floors as my tenant was moving in. They did an amazing job and were super understanding as the heat wasn't even on yet! Thank you again!! Would recommend to anyone with a cleaning need.",
    rating: 5,
  },
  {
    id: 10,
    reviewer_name: "Krystal",
    comment:
      "This team was great!!! I asked for a deep clean and little did I know the team was laying on the floors cleaning trim, baseboards, under dishwasher and couch! I have used several times now and so happy with their work. Thanks ladies!!!",
    rating: 5,
  },
  {
    id: 11,
    reviewer_name: "Jon",
    comment:
      "Amanda and her staff are awesome. always working around my schedule and answering any questions I have. They keep me organized. Amanda also made time to help me with a move out cleaning, for which I got my full deposit back.",
    rating: 5,
  },
  {
    id: 12,
    reviewer_name: "Kasia",
    comment:
      "I’m beyond grateful to Amanda and her team for the amazing deep clean they did in my home. As a full-time working mom, it’s been tough to keep up—and they truly went above and beyond. The attention to detail was outstanding, and the house feels so fresh and welcoming now. From the initial consultation, Amanda was thorough, professional, and incredibly kind. She even took the time to chat with my curious toddler, who had a million questions for her! Thank you so much for your hard work!",
    rating: 5,
  },
  ];

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black min-h-screen pt-24 text-gray-100">
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent)] pointer-events-none"></div>

      {/* Section Title */}
      <section className="text-center relative z-10">
        <h1 className="text-3xl md:text-5xl mt-6 border-b-2 border-yellow-400 font-extrabold text-blue-400 drop-shadow-lg tracking-wider uppercase">
          What Our Clients Say
        </h1>
        <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
          Real stories from happy clients who trust us to make their spaces
          spotless ✨
        </p>
      </section>

      {/* Reviews Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentReviews.map((review) => (
          <div
            key={review.id}
            className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg border border-blue-700/40 hover:shadow-blue-500/30 transition transform hover:scale-105"
          >
            <p className="text-lg font-bold text-blue-300 mb-2">
              {review.reviewer_name}
            </p>
            <p className="text-sm text-gray-300 mb-4">{review.comment}</p>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`${
                    i < review.rating ? "text-yellow-400" : "text-gray-600"
                  } text-lg`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6 pb-12">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${
            currentPage === 1
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Previous
        </button>

        <span className="text-gray-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded ${
            currentPage === totalPages
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ReviewList;

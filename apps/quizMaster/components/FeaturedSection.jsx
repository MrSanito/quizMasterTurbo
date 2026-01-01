"use client";
import Image from "next/image";

const features = [
  {
    title: "Compete and Climb the Ranks on Our Leaderboard",
    description:
      "Show off your skills and see how you stack up against others.",
    action: "Learn More →",
  },
  {
    title: "Challenge Yourself with Daily Quizzes Tailored for You",
    description:
      "Test your knowledge every day and earn rewards for participation.",
    action: "Sign Up →",
  },
  {
    title: "Engage in Daily Challenges to Boost Your Skills",
    description:
      "Take on new challenges each day and enhance your learning journey.",
    action: "Join →",
  },
];

const FeaturedSection = () => {
  return (
    <section className="py-16 bg-base-200">
      <div className="container mx-auto px-6 md:px-12 text-center">
        {/* Section Title */}
        <h2 className="text-4xl font-bold text-primary mb-8   inline-block px-4 py-2">
          Explore Exciting Features of Our <br />
          Engaging Web App Experience
        </h2>

        {/* Feature Cards */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center mt-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="w-full md:w-1/3 bg-base-100 p-6 rounded-lg shadow-lg text-center flex flex-col items-center"
            >
              {/* Placeholder Image */}
              <div className="w-full h-40 bg-gray-300 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500">Image Placeholder</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>

              {/* Description */}
              <p className="text-gray-600 mb-4">{feature.description}</p>

              {/* Action Link */}
              <a href="#" className="text-primary font-medium hover:underline">
                {feature.action}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;

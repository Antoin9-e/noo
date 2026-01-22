import { Link } from "react-router-dom";

export default function LeftPageDesign() {
  return (
    <div className="w-[40%] bg-linear-to-r from-violet-800   via-violet-500 to-violet-300 rounded-r-4xl min-h-screen shadow-[0_0_80px_rgba(139,92,246,0.35)]">
      <div className="flex flex-col justify-center items-center h-full text-amber-100 p-8 ">
        <h1
          className="text-6xl font-bold mb-4 mt-[20%] tracking-tight text-shadow-lg cursor-pointer"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <Link to="/">Noo</Link>
        </h1>
      </div>
    </div>
  );
}

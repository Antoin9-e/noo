import { Link } from "react-router-dom";

export default function LeftPageDesign() {
  return (
    <div
      className="w-[45%] min-h-screen rounded-r-[20px] flex flex-col justify-center items-center p-8 
      bg-gradient-to-br from-[#1e0a3c] via-[#4c1d95] to-[#f97316] 
      relative overflow-hidden shadow-[20px_0_60px_rgba(0,0,0,0.5)]"
    >
      {/* Halo de lumière violette pour donner de la texture au noir/violet */}
      <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.15),transparent_70%)]" />

      {/* Point chaud orange pour renforcer l'éclat dans le coin bas/droit */}
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-orange-600/20 rounded-full blur-[100px]" />

      <h1
        className="text-8xl font-bold tracking-tighter cursor-pointer z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        <Link to="/" className="text-white selection:bg-orange-500">
          Noo
        </Link>
      </h1>

      <p className="text-white/60 mt-4 font-light tracking-[0.3em] uppercase text-[10px] z-10 border-t border-white/10 pt-4">
        Family essentials, redefined.
      </p>
    </div>
  );
}

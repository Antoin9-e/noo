import Header from "@/components/page/Header";
export default function HomePage() {
  return (
    <div>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Welcome to Noo</h1>
        <p className="text-lg text-gray-700">Your productivity companion.</p>
      </div>
    </div>
  );
}

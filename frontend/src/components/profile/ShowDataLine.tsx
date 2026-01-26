export default function ShowDataLine({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex justify-between p-2 border-b rounded-xl bg-gray-50 w-[80%] mt-4 ">
      <span className="font-bold text-gray-600">{label + ":"}</span>
      <span className="text-gray-800">{value ?? "N/A"}</span>
    </div>
  );
}

import { Link } from "react-router-dom";
import { TabsContent } from "../ui/tabs";

export default function ProfileContent({
  data,
}: {
  data: Array<{ id: string; name: string }>;
}) {
  if (!data || data.length === 0) {
    return <TabsContent value="family">No families found.</TabsContent>;
  }

  return (
    <TabsContent value="family">
      <h3 className="text-xl font-semibold mb-4">My Families</h3>
      <ul className="space-y-2">
        {data.map((family) => (
          <Link to={`/families/${family.id}`} key={family.id}>
            <li className="p-2 bg-gray-100 rounded">{family.name}</li>
          </Link>
        ))}
      </ul>
    </TabsContent>
  );
}

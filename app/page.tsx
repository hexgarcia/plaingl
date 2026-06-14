import { listEntities } from "./actions";
import Shell from "./Shell";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const entities = await listEntities();
  return <Shell initialEntities={entities} />;
}

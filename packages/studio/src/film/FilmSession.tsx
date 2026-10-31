import { AssistantPanel } from "./AssistantPanel";
import { ProductionPanel } from "./ProductionPanel";
import { useFilmSession } from "./useFilmSession";

/** Both film panels, without dock chrome, for tests and for the dock host. */
export function FilmSession({
  showToast,
}: {
  showToast: (message: string, tone?: "error" | "info") => void;
}) {
  const { production, assistant } = useFilmSession(showToast);
  return (
    <>
      <ProductionPanel {...production} />
      <AssistantPanel {...assistant} />
    </>
  );
}

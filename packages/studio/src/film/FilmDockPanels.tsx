import { Dock } from "../components/dock/Dock";
import { AssistantPanel } from "./AssistantPanel";
import { ProductionPanel } from "./ProductionPanel";
import { useFilmSession } from "./useFilmSession";

/** Production and Assistant dock tabs. They stay honest while no film host is connected. */
export function FilmDockPanels({
  showToast,
}: {
  showToast: (message: string, tone?: "error" | "info") => void;
}) {
  const { production, assistant } = useFilmSession(showToast);
  return (
    <>
      <Dock.Panel id="production">
        <ProductionPanel {...production} />
      </Dock.Panel>
      <Dock.Panel id="assistant">
        <AssistantPanel {...assistant} />
      </Dock.Panel>
    </>
  );
}

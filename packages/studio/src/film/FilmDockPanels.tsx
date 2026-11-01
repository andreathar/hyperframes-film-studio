import { Dock } from "../components/dock/Dock";
import { AssistantPanel } from "./AssistantPanel";
import { ProductionPanel } from "./ProductionPanel";
import type { TbcClient } from "./tbc/client";
import { TbcAssistantPanel } from "./tbc/TbcAssistantPanel";
import { TbcProductionPanel } from "./tbc/TbcProductionPanel";
import { useTbcSession } from "./tbc/useTbcSession";
import { useFilmSession } from "./useFilmSession";

/**
 * Production and Assistant dock tabs. When `tbc serve` answers `/api/health` they show its
 * manifest; otherwise they stay honest about having no film host (copy handoff still works).
 */
export function FilmDockPanels({
  showToast,
  tbc,
}: {
  showToast: (message: string, tone?: "error" | "info") => void;
  tbc?: TbcClient;
}) {
  const session = useTbcSession(tbc);
  const { production, assistant } = useFilmSession(showToast);
  if (session.kind === "connected") {
    return (
      <>
        <Dock.Panel id="production">
          <TbcProductionPanel {...session.production} />
        </Dock.Panel>
        <Dock.Panel id="assistant">
          <TbcAssistantPanel {...session.assistant} />
        </Dock.Panel>
      </>
    );
  }
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

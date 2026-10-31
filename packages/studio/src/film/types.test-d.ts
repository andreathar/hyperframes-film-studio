import { describe, expectTypeOf, it } from "vitest";
import type {
  AssistantProviderV1,
  AssistantReadinessStateV1,
  AssistantReadinessV1,
  ProjectShotViewV1,
  ReferenceRole,
  SoundStrategyV1,
} from "@hyperframes/film-production/browser";
import type { ReferenceRole as ContractReferenceRole, SoundStrategy } from "./contractTypes";
import type { AssistantReadinessView, ProductionShot, ShotReference } from "./types";

describe("film view types follow the contracts", () => {
  it("uses the contract role and readiness unions", () => {
    expectTypeOf<ShotReference["role"]>().toEqualTypeOf<ReferenceRole>();
    expectTypeOf<AssistantReadinessView>().toEqualTypeOf<AssistantReadinessV1>();
    expectTypeOf<AssistantReadinessView["state"]>().toEqualTypeOf<AssistantReadinessStateV1>();
    expectTypeOf<AssistantReadinessView["provider"]>().toEqualTypeOf<AssistantProviderV1>();
  });

  it("derives the shot from the contract shot view", () => {
    expectTypeOf<ProductionShot["direction"]>().toEqualTypeOf<ProjectShotViewV1["direction"]>();
    expectTypeOf<ProductionShot["references"]>().toEqualTypeOf<ShotReference[]>();
    expectTypeOf<ProductionShot>().not.toHaveProperty("referenceIds");
  });

  it("re-exports the contract role and sound strategy", () => {
    expectTypeOf<ContractReferenceRole>().toEqualTypeOf<ReferenceRole>();
    expectTypeOf<SoundStrategy>().toEqualTypeOf<SoundStrategyV1>();
  });
});

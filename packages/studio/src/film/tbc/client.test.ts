import { describe, expect, it } from "vitest";
import { DEFAULT_TBC_URL, TbcError, tbcClient, tbcBaseUrl, type FetchLike } from "./client";
import { CONTEXT, HEALTH, ROWS, TURN } from "./tbcFixtures";

interface Call {
  url: string;
  init: RequestInit | undefined;
}

function fakeFetch(answers: Record<string, { status: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetcher: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const key = `${init?.method ?? "GET"} ${url.replace("http://tbc.test", "")}`;
    const answer = answers[key];
    if (answer === undefined)
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    return new Response(JSON.stringify(answer.body), { status: answer.status });
  };
  return { calls, fetcher };
}

function header(call: Call | undefined, name: string): string | null {
  return new Headers(call?.init?.headers).get(name);
}

describe("tbcClient", () => {
  it("defaults to tbc serve's port when VITE_TBC_URL is unset", () => {
    expect(DEFAULT_TBC_URL).toBe("http://127.0.0.1:4317");
    expect(tbcBaseUrl()).toBe(DEFAULT_TBC_URL);
  });

  it("reads health, shots and a shot context", async () => {
    const { fetcher } = fakeFetch({
      "GET /api/health": { status: 200, body: HEALTH },
      "GET /api/shots": { status: 200, body: ROWS },
      "GET /api/shots/G-02/context": { status: 200, body: CONTEXT },
    });
    const client = tbcClient("http://tbc.test", fetcher);
    expect((await client.health()).manifest).toBe("tbc");
    expect((await client.shots()).map((row) => row.id)).toEqual(["G-01", "G-02"]);
    expect((await client.context("G-02")).revision).toBe(CONTEXT.revision);
    expect(client.lookMediaUrl("ELENA", "front")).toBe(
      "http://tbc.test/api/media/look/ELENA/front",
    );
  });

  it("refuses to POST before health has given it the CSRF token", async () => {
    const { calls, fetcher } = fakeFetch({});
    const client = tbcClient("http://tbc.test", fetcher);
    await expect(
      client.startTurn({ shotId: "G-02", instruction: "x", revision: "r" }),
    ).rejects.toThrow("has not answered /api/health");
    expect(calls).toHaveLength(0);
  });

  it("sends the CSRF token, JSON and the shown revision on every POST", async () => {
    const { calls, fetcher } = fakeFetch({
      "GET /api/health": { status: 200, body: HEALTH },
      "POST /api/assistant/turns": { status: 202, body: TURN },
      "POST /api/assistant/turns/t1/cancel": { status: 200, body: { ...TURN, state: "cancelled" } },
    });
    const client = tbcClient("http://tbc.test", fetcher);
    await client.health();
    await client.startTurn({ shotId: "G-02", instruction: "quieter", revision: "rev-1" });
    await client.cancel("t1");
    const posts = calls.filter((call) => call.init?.method === "POST");
    expect(posts).toHaveLength(2);
    for (const post of posts) {
      expect(header(post, "x-tbc-csrf")).toBe(HEALTH.csrf);
      expect(header(post, "content-type")).toBe("application/json");
    }
    expect(JSON.parse(String(posts[0]?.init?.body))).toEqual({
      shotId: "G-02",
      instruction: "quieter",
      revision: "rev-1",
    });
  });

  it("asks a turn only for events after the ones it has", async () => {
    const { calls, fetcher } = fakeFetch({
      "GET /api/assistant/turns/t1?after=3": { status: 200, body: TURN },
    });
    await tbcClient("http://tbc.test", fetcher).turn("t1", 3);
    expect(calls[0]?.url).toBe("http://tbc.test/api/assistant/turns/t1?after=3");
  });

  it("turns a refusal into a TbcError carrying the status and blocking issues", async () => {
    const issues = [{ code: "stale", severity: "error", where: "G-02", message: "changed" }];
    const { fetcher } = fakeFetch({
      "GET /api/health": { status: 200, body: HEALTH },
      "POST /api/assistant/turns/t1/proposals/0/apply": {
        status: 422,
        body: { error: "this proposal cannot be applied now", issues },
      },
    });
    const client = tbcClient("http://tbc.test", fetcher);
    await client.health();
    const failure = await client.apply("t1", 0, "rev-1").catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TbcError);
    if (!(failure instanceof TbcError)) return;
    expect(failure.status).toBe(422);
    expect(failure.message).toBe("this proposal cannot be applied now");
    expect(failure.issues.map((issue) => issue.code)).toEqual(["stale"]);
  });

  it("rejects an answer that is not the shape it expects", async () => {
    const { fetcher } = fakeFetch({ "GET /api/health": { status: 200, body: { ok: true } } });
    await expect(tbcClient("http://tbc.test", fetcher).health()).rejects.toThrow(
      "unexpected answer from /api/health",
    );
  });
});

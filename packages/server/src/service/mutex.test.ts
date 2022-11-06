import { timeout } from "@common/functions";
import "ts-jest";
import { Awaiter, Mutex } from "./mutex";

describe("Mutual exclusion test", function () {
  describe("Empty param", () => {
    const ctx = new Mutex()
    const awaiters: Awaiter[] = [
      new Awaiter(),
      new Awaiter(),
      new Awaiter(),
      new Awaiter(),
      new Awaiter(),
    ];

    for (const awaiter of awaiters) {
      ctx.lock(awaiter)
    }

    it("one lock should be active and queue has to have 4 items", async () => {
      expect(ctx.len()).toBe(awaiters.length - 1) // 1 item is the active lock
      expect(ctx.isLocked()).toBe(true)
    });

    it("unlock on each awaiter should result in empty queue", async () => {
      for (const awaiter of awaiters) {
        ctx.unlock(awaiter)
        await timeout(1) // unlock needs the async cb to manage itself, only after that the queue will assign next lock
      }

      expect(ctx.len()).toBe(0)
    });
  });
});

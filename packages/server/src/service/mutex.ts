/**
 * Mutex class implements locking mechanism to enable mutual exclusion while accessing database collections
 */
export class Mutex {
    private activeLock?: Awaiter;
    private queue: Awaiter[] = [];

    /**
     * Returns number of waiting items
     * @returns
     */
    len(): number {
        return this.queue.length
    }

    /**
     * Predicate for testing if the mutex is locked
     * @returns 
     */
    isLocked(): boolean {
        return !!this.activeLock
    }

    /**
     * Acquire lock - immediately if currently no lock exists or wait until freed
     * @returns 
     */
    async lock(awaiter: Awaiter): Promise<void> {
        if (this.activeLock) {
            await this.waitForUnlock(awaiter);
        }

        this.activeLock = awaiter
    }

    /**
     * Provides promise which will be resolved only if someone clears the lock via Mutex.unlock method.
     * 
     */
    async waitForUnlock(awaiter: Awaiter): Promise<void> {
        await new Promise((resolve, reject) => {
            awaiter.onSuccess = (value: unknown) => {
                resolve(value)
            }

            awaiter.onError = (reason?: any) => {
                const index = this.queue.findIndex(m => m === awaiter)
                if (index !== -1) {
                    this.queue.splice(index, 1)
                }
                reject(reason)
            }
            this.queue.push(awaiter);
        })
    }

    /**
     * Unlock the mutex with provided Awaiter
     * @param awaiter 
     * @returns 
     */
    unlock(awaiter: Awaiter) {
        // continue, if this mutex haven't locked
        if (awaiter !== this.activeLock) {
            return
        }

        if (this.queue.length) {
            (this.queue.shift() as Awaiter).onSuccess(null);
        }

        this.activeLock = undefined;
    }
}

/**
 * Structure for holding callbacks - their invocations result in either locking or failing.
 * In both cases, the calls should remove the instance from queue.
 */
export class Awaiter {
    onSuccess: (value: unknown) => void = () => { }
    onError: (reason?: any) => void = () => { }
}

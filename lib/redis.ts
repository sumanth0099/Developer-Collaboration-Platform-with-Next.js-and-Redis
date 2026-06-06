import { Redis } from "@upstash/redis";

const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

class MockRedis {
  private store = new Map<string, string>();
  private ttls = new Map<string, number>();

  async get<T>(key: string): Promise<T | null> {
    const ttl = this.ttls.get(key);
    if (ttl && Date.now() > ttl) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    const val = this.store.get(key);
    if (val === undefined) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }

  async set(
    key: string,
    value: any,
    options?: { ex?: number; px?: number }
  ): Promise<string> {
    const valStr = typeof value === "string" ? value : JSON.stringify(value);
    this.store.set(key, valStr);
    if (options?.ex) {
      this.ttls.set(key, Date.now() + options.ex * 1000);
    } else if (options?.px) {
      this.ttls.set(key, Date.now() + options.px);
    } else {
      this.ttls.delete(key);
    }
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        this.ttls.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const val = await this.get<number>(key);
    const newVal = (Number(val) || 0) + 1;
    await this.set(key, newVal);
    return newVal;
  }

  async getset(key: string, value: any): Promise<any> {
    const oldVal = await this.get(key);
    await this.set(key, value);
    return oldVal;
  }

  async keys(pattern: string): Promise<string[]> {
    const regexStr = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexStr}$`);
    const matched: string[] = [];
    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) {
        const ttl = this.ttls.get(key);
        if (ttl && Date.now() > ttl) {
          this.store.delete(key);
          this.ttls.delete(key);
        } else {
          matched.push(key);
        }
      }
    }
    return matched;
  }

  pipeline() {
    const self = this;
    const commands: (() => Promise<any>)[] = [];
    return {
      zremrangebyscore(key: string, min: number, max: number) {
        commands.push(async () => {
          const members =
            (await self.get<Array<{ score: number; member: string }>>(key)) || [];
          const remaining = members.filter(
            (m) => m.score < min || m.score > max
          );
          await self.set(key, remaining);
          return members.length - remaining.length;
        });
        return this;
      },
      zcard(key: string) {
        commands.push(async () => {
          const members =
            (await self.get<Array<{ score: number; member: string }>>(key)) || [];
          return members.length;
        });
        return this;
      },
      zadd(key: string, data: { score: number; member: string }) {
        commands.push(async () => {
          const members =
            (await self.get<Array<{ score: number; member: string }>>(key)) || [];
          members.push(data);
          await self.set(key, members);
          return 1;
        });
        return this;
      },
      pexpire(key: string, px: number) {
        commands.push(async () => {
          self.ttls.set(key, Date.now() + px);
          return 1;
        });
        return this;
      },
      async exec() {
        const results = [];
        for (const cmd of commands) {
          results.push(await cmd());
        }
        return results;
      },
    };
  }
}

export const redis = isRedisConfigured
  ? Redis.fromEnv()
  : (new MockRedis() as unknown as Redis);

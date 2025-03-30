import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * 扩展默认session类型
   */
  interface Session {
    user: {
      id?: string;
      username?: string;
    } & DefaultSession["user"];
  }

  /**
   * 扩展默认user类型
   */
  interface User {
    username?: string;
  }
}

declare module "next-auth/jwt" {
  /** 扩展JWT类型 */
  interface JWT {
    id?: string;
    username?: string;
  }
} 
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.username || !credentials?.password) {
          throw new Error('请提供用户名和密码');
        }

        const user = await User.findOne({ username: credentials.username });

        if (!user) {
          throw new Error('用户不存在');
        }

        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          throw new Error('密码错误');
        }

        return {
          id: user._id.toString(),
          username: user.username,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.username as string,
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 
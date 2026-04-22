import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      return isAdminEmail(profile?.email);
    },
    authorized({ request, auth: session }) {
      const { pathname } = request.nextUrl;
      const isLogin = pathname === "/login";
      const isLoggedIn = !!session?.user?.email && isAdminEmail(session.user.email);

      if (isLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.url));
        }
        return true;
      }

      if (!isLoggedIn) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
});

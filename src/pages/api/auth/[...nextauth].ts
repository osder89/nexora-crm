import NextAuth from "next-auth";

import { authOptions } from "@/services/auth/auth-options";

export default NextAuth(authOptions);


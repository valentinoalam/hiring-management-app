
import { NextAuthOptions } from "next-auth";
// import Providers from 'next-auth/providers';
import CredentialsProvider from 'next-auth/providers/credentials';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getGoogleClient } from "@/lib/gClient";
import jwt from "jsonwebtoken";
const masterSheetId = process.env.ITIKAF_DATASHEET || "";

async function readMasterSheet() {
  const client = await getGoogleClient()
  const doc = new GoogleSpreadsheet(masterSheetId, client)
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle["Master Data"]
  await sheet.loadHeaderRow(5)
  return sheet
}

async function validateUser(name: string) {
  try {
    const sheet = await readMasterSheet()
    const rows = await sheet.getRows();
    const user = rows.find(
      (row) => row.get("Nama Lengkap")?.toLowerCase() === name.toLowerCase()
    );
    // const clientExists = rows.some(row => {
    //   const clientName = row.get("Nama Lengkap")?.toLowerCase() || ""
    //   return clientName.toLowerCase() === name.toLowerCase()
    // })

    if (!user) {
        throw new Error("Nama yang anda masukan belum terdaftar. Coba tanyakan panitia atau segera lakukan pendaftaran.")
    }
    return {
        id: user.rowNumber.toString(),
        name: user.get("Nama Lengkap"),
        sex: user.get("Jenis Kelamin"),
        role: user.get("Role") || "user"
    };
  } catch (error) {
    console.error("Error validating user:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
    providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.name) return null;

          const user = await validateUser(credentials.name);
          
          if (!user) return null;

          // Generate a custom JWT token with user data
          const token = jwt.sign(
            {
              name: user.name,
              sex: user.sex,
              role: user.role
            },
            process.env.NEXTAUTH_SECRET || "your-fallback-secret",
            { expiresIn: "7d" }
          );

          return {
            id: user.id,
            name: user.name,
            sex: user.sex,
            role: user.role,
            accessToken: token,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
    ],
    pages: {
        signIn: '/itikaf/auth/login',
        error: '/itikaf/auth/login',  // Error redirects to login page
        signOut: '/',     // Optional: customize the sign-out redirect
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
    session: {
      strategy: 'jwt',
      maxAge: 15 * 24 * 60 * 60, // Example: 30 days
      updateAge: 24 * 60 * 60,
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET as string,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: false,
    callbacks: {
        async jwt({ token, user }) {
          if (user) {
            token.accessToken = user.accessToken;
            token.sex = user.sex;
            token.role = user.role;
          }
          return token;
        },
        async session({ session, token }) {
          if (token) {
            session.user.sex = token.sex as string;
            session.user.role = token.role as string;
            session.accessToken = token.accessToken as string;
          }
          return session;
        },
      },
    events: {
        async signIn({ user, account, profile }) {
        console.log(account, profile)
        // You can log sign-ins or perform additional actions here
        console.log("User signed in:", user.email)
        },
        async signOut({ session, token }) {
        console.log(session, token)
        // Clean up any necessary session data
        console.log("User signed out")
        },
    },
};
import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getAuth } from "firebase-admin/auth";

export const GET: APIRoute = async ({request, cookies, redirect}) => {
    const auth = getAuth(app)

    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    console.log("HOLA")
    
    if(!idToken){
        return new Response(
            "No token found",
            { status: 401 }
        );
    }

    let sessionCookie;
    try {
        
        await auth.verifyIdToken(idToken)
        
        const fiveDays = 60 * 60 * 24 * 5 * 1000
        
        sessionCookie = await auth
      .createSessionCookie(idToken, { expiresIn: fiveDays })
      .catch((error) => {
        return new Response(
          JSON.stringify({
            message: error.message,
          }),
          { status: 401 }
        );
      });

    } catch (error: any) {
        return new Response(
          JSON.stringify({
            error: "El servidor canceló la solicitud",
          }),
          { status: 401 }
        );
      }
    
    cookies.set("session", sessionCookie, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 5 * 1000
    })
    

    return redirect("/")
}
import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app } from "../../../firebase/server"
import { db, Users } from "astro:db"
import { removeExtraSpaces } from "../../../lib/cleanSentences";
import { type AuthError } from "@firebase/auth";

export const POST: APIRoute = async ({ request, redirect }) => {
  const auth = getAuth(app);

  const formData = await request.formData();
  const name = removeExtraSpaces(formData.get("name")?.toString());
  const lastname = removeExtraSpaces(formData.get("lastname")?.toString());
  const email = removeExtraSpaces(formData.get("email")?.toString());
  const password = removeExtraSpaces(formData.get("password")?.toString());

if(!name || !lastname || !password || !email) {
  return new Response(JSON.stringify(
      "Complete todos los campos"
    ), {status: 400});
  } else if(password?.length < 6){
    return new Response(JSON.stringify("Su contraseña necesita tener al menos 6 carácteres"),
      {status: 400})
    };
  
  /* Create user */
  try {

    const user = {
        email,
        password,
        displayName: name
    }
    
    const newUser = await auth.createUser(user);
    try {
      console.log(newUser.uid, `${name} ${lastname}`, email, )
      await db.insert(Users).values({
        id: newUser.uid,
        fullName: `${name} ${lastname}`,
        email: email,
        schoolID: null,
        role: "user"
      })

    } catch(errorDb) {

      console.log(errorDb)
      return new Response(JSON.stringify("Error al insertar en la base de datos"),
    {status: 500}
  );
    };

  return redirect("/iniciar-sesion");

  } catch (error: any) {
    if (error instanceof Error) {

      const errorCode = (error as AuthError).code.toString();

      switch (errorCode) {
        case "auth/invalid-email":
          return new Response (JSON.stringify("La dirección de correo electrónico no es válida."), {
            status: 400
          });
        case "auth/auth/invalid-password":
            return new Response(JSON.stringify("La contraseña es muy débil. Debe tener al menos 8 carácteres."));
        case "auth/email-already-exists":
          return new Response(JSON.stringify("Ya existe una cuenta utilizando este correo electrónico. Si ya tiene una cuenta, inicie sesión."),
        {
          status: 401
        })

        case "auth/too-many-requests":
          return new Response(JSON.stringify("Demasiados intentos, intente más tarde."),
        {
          status: 401
        }
      );
        default:
          return new Response(JSON.stringify("Algo ha salido mal, vuelva a intentar."));
      }
    }
    console.log(error)

    return new Response(JSON.stringify("Algo salio mal..."),
      {status: 400});
  }
};
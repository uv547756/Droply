import * as z from "zod";

export const signUpSchema = z
    .object({
        email: z
            .string()
            .min(1, {message: "email is required."})
            .email({message: "Please enter a valid email."}),
        password: z
            .string()
            .min(1, {message: "password is required."})
            .min(8, {message: "password should be minimum of 8 characters."}),
        passwordConfirmation: z
            .string()
            .min(1, {message: "Please confirm your password"}),
})
.refine((data) => data.password === data.passwordConfirmation, {
  message: "Password does not match.",
  path: ["passwordConfirmation"],
})

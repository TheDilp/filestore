import { createLazyRoute } from "@tanstack/react-router";
import { useState } from "react";
import { email, object, string } from "zod";

import { Icon } from "../components";
import { authFetchFunction, useAppForm } from "../utils";

function Register() {
  const [isRegistered, setIsRegistered] = useState(false);

  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password1: "",
      password2: "",
    },
    validators: {
      onSubmit: object({
        firstName: string({ error: "First name is required." }),
        lastName: string({ error: "First name is required." }),
        username: string().min(8, {
          error: "Username must be at least 8 characters.",
        }),
        email: email({ error: "Valid email is required." }),
        password1: string().min(12, {
          error: "Password must be at least 12 characters.",
        }),
        password2: string().min(12, {
          error: "Password must be at least 12 characters.",
        }),
      }).superRefine((args, ctx) => {
        if (args.password1 !== args.password2)
          ctx.addIssue({
            code: "custom",
            message: "Passwords do not match.",
            path: ["password2"],
          });
      }),
    },
    onSubmit: async (ctx) => {
      const res = await authFetchFunction<string>({
        url: "register",
        method: "POST",
        body: JSON.stringify({
          username: ctx.value.username,
          firstName: ctx.value.firstName,
          lastName: ctx.value.lastName,
          email: ctx.value.email,
          password1: ctx.value.password1,
          password2: ctx.value.password2,
        }),
      });
      if (res.ok) setIsRegistered(true);
    },
  });
  return (
    <div className="border-primary flex h-fit w-96 flex-col rounded-xl border bg-white p-4 shadow-md">
      <div className="flex w-full justify-center">
        <Icon icon="arcticons:realityscan" fontSize={56} />
      </div>
      {isRegistered ? (
        <div className="mt-8 flex flex-col gap-y-8">
          <h2 className="text-center text-2xl font-medium">
            A confirmation email has been sent
          </h2>
          <p className="text-center text-lg">
            Please click the link in the email to verify your account.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-medium">Register</h2>
          <form
            className="flex flex-1 flex-col gap-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <form.AppField
              name="firstName"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="First name"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppField
              name="lastName"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="Last name"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppField
              name="username"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="Username"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppField
              name="email"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="Email"
                  type="email"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppField
              name="password1"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="Password"
                  type="password"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppField
              name="password2"
              children={(field) => (
                <field.Input
                  onChange={(e) => field.handleChange(e.value || "")}
                  name={field.name}
                  value={field.state.value}
                  title="Password confirm"
                  type="password"
                  errors={field.state.meta.errors}
                />
              )}
            />
            <form.AppForm>
              <form.Subscribe
                children={(child) => (
                  <form.Button
                    isFullWidth
                    title="Register"
                    variant="success"
                    onClick={form.handleSubmit}
                    isDisabled={!child.canSubmit}
                  />
                )}
              />
            </form.AppForm>
          </form>
        </>
      )}
    </div>
  );
}

export const registerLazyRoute = createLazyRoute("/auth/register")({
  component: Register,
});

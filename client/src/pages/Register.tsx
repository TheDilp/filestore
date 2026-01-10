import { Link, useNavigate } from "@tanstack/react-router";
import { email, object, string } from "zod";

import { Icon } from "../components";
import { authFetchFunction, useAppForm } from "../utils";

export function Register() {
  const navigate = useNavigate();
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
      if (res.ok) navigate({ to: "/auth/login" });
    },
  });
  return (
    <div className="border-primary flex h-fit w-96 flex-col rounded-xl border bg-white p-4 shadow-md">
      <div className="flex w-full justify-center">
        <Icon fontSize={56} icon="arcticons:realityscan" />
      </div>

      <h2 className="text-center text-2xl font-medium">Register</h2>
      <form
        className="flex flex-1 flex-col gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="First name"
              value={field.state.value}
            />
          )}
          name="firstName"
        />
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Last name"
              value={field.state.value}
            />
          )}
          name="lastName"
        />
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Username"
              value={field.state.value}
            />
          )}
          name="username"
        />
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Email"
              type="email"
              value={field.state.value}
            />
          )}
          name="email"
        />
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Password"
              type="password"
              value={field.state.value}
            />
          )}
          name="password1"
        />
        <form.AppField
          children={(field) => (
            <field.Input
              errors={field.state.meta.errors}
              name={field.name}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Password confirm"
              type="password"
              value={field.state.value}
            />
          )}
          name="password2"
        />
        <form.AppForm>
          <Link className="w-full text-right" to="/auth/login">
            <span className="text-blue-400">Login</span>
          </Link>
          <form.Subscribe
            children={(child) => (
              <form.Button
                isDisabled={!child.canSubmit}
                isFullWidth
                onClick={form.handleSubmit}
                title="Register"
                variant="success"
              />
            )}
          />
        </form.AppForm>
      </form>
    </div>
  );
}

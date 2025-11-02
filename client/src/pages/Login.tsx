import {
  createLazyRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { type infer as zodInfer, object, string } from "zod";

import { UserAtom } from "../atoms";
import { Icon } from "../components";
import { LoginSchema, LoginSearchParamsSchema } from "../schemas";
import type { BaseAuthCallbackType } from "../types";
import { authFetchFunction, useAppForm } from "../utils";

function Login() {
  const params = useSearch({ from: "/auth/login", strict: true }) as zodInfer<
    typeof LoginSearchParamsSchema
  >;
  const navigate = useNavigate();
  const setUserAtom = useSetAtom(UserAtom);
  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: object({
        username: string().min(8, {
          error: "Username must be at least 8 characters.",
        }),
        password: string().min(12, {
          error: "Password must be at least 12 characters.",
        }),
      }),
    },
    onSubmit: async (data) => {
      if (params.state && params.code_challenge) {
        const callbackRes = await authFetchFunction<BaseAuthCallbackType>({
          url: "callback",
          method: "GET",
          searchParams: new URLSearchParams([
            ["state", params.state],
            ["code", params.code_challenge],
            ["username", data.value.username],
            ["password", data.value.password],
          ]),
        });
        if (callbackRes.ok && callbackRes?.data?.user.id) {
          const validation = LoginSchema.safeParse(callbackRes.data.user);

          if (validation.success) {
            setUserAtom(validation.data);
            navigate({ to: "/" });
          } else console.error(validation);
        }
      }
    },
  });
  return (
    <div className="border-primary flex h-fit w-96 flex-col rounded-xl border bg-white p-4 shadow-md">
      <div className="flex w-full justify-center">
        <Icon icon="arcticons:realityscan" fontSize={56} />
      </div>
      <h2 className="text-center text-2xl font-medium">Welcome back</h2>
      <form
        className="flex flex-1 flex-col gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
          name="password"
          children={(field) => (
            <field.Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.value || "")}
              title="Password"
              name={field.name}
              type="password"
              errors={field.state.meta.errors}
            />
          )}
        />
        <div className="mb-2 mt-auto flex w-full flex-col gap-y-1">
          <Link to="/auth/register" className="w-full text-right">
            <span className="text-blue-400">Register now</span>
          </Link>
          <form.AppForm>
            <form.Subscribe
              children={(child) => (
                <form.Button
                  isFullWidth
                  title="Sign in"
                  variant="success"
                  onClick={form.handleSubmit}
                  isDisabled={!child.canSubmit}
                />
              )}
            />
          </form.AppForm>
        </div>
      </form>
    </div>
  );
}

export const loginLazyRoute = createLazyRoute("/auth/login")({
  component: Login,
});

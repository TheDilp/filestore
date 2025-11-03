import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { AuthLayout, MainLayout } from "./components";
import { LoginSearchParamsSchema } from "./schemas";
import type { BaseAuthCallbackType } from "./types";
import { authFetchFunction } from "./utils";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 3 * 60 * 1000, // expressed in ms, equal to 3 mins
    },
  },
});

const rootRoute = createRootRoute({
  beforeLoad: async () => {
    return {
      auth: await queryClient.ensureQueryData<
        BaseAuthCallbackType | { user: null }
      >({
        queryKey: ["user"],
        queryFn: async () => {
          try {
            const res = await authFetchFunction<BaseAuthCallbackType>({
              method: "GET",
              url: "session",
            });
            if (res.ok && res.data) return res.data;
            else return { user: null };
          } catch (error) {
            console.error(error);
            return { user: null };
          }
        },
        staleTime: 8 * 60 * 60 * 1000,
      }),
    };
  },
  loader: (ctx) => {
    if (
      !ctx.context.auth.user &&
      !ctx.location.pathname.endsWith("/auth/login") &&
      !ctx.location.pathname.endsWith("/auth/register")
    )
      throw redirect({ to: "/auth/login" });
    if (
      !!ctx.context.auth.user?.id &&
      (ctx.location.pathname.endsWith("/auth/login") ||
        ctx.location.href === "/")
    )
      throw redirect({ to: "/browser/{-$path}" });
  },
  component: () => <Outlet />,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  loader: (ctx) => {
    if (
      !ctx.context.auth.user &&
      !ctx.location.pathname.endsWith("/auth/login") &&
      !ctx.location.pathname.endsWith("/auth/register")
    )
      throw redirect({ to: "/auth/login" });
    if (
      !!ctx.context.auth.user?.id &&
      ctx.location.pathname.endsWith("/auth/login")
    )
      throw redirect({ to: "/browser/{-$path}" });
  },
  path: "/",
  component: () => (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </QueryClientProvider>
  ),
});

const authRoute = createRoute({
  beforeLoad: (ctx) => {
    if (ctx.location.pathname === "/auth")
      throw redirect({ to: "/auth/login" });
  },
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/register",
}).lazy(() => import("./pages/Register").then((d) => d.registerLazyRoute));

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  validateSearch: zodValidator(LoginSearchParamsSchema),
  path: "/login",
  beforeLoad: async (ctx) => {
    if (!ctx.search.code_challenge || !ctx.search.state) {
      const res = await authFetchFunction<{ auth_url: string; state: string }>({
        url: "login",
        method: "POST",
      });
      if (res.ok && res.data) window.location.replace(res.data.auth_url);
    }
  },
}).lazy(() => import("./pages/Login").then((d) => d.loginLazyRoute));

const browserRoute = createRoute({
  getParentRoute: () => indexRoute,
  path: "/browser/{-$path}",
}).lazy(() =>
  import("./pages/FileBrowser").then((d) => d.fileBrowserLazyRoute)
);

const routeTree = rootRoute.addChildren([
  indexRoute.addChildren([browserRoute]),
  authRoute.addChildren([registerRoute, loginRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

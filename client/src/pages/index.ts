import { createLazyRoute } from "@tanstack/react-router";

import { BucketBrowser } from "./BucketBrowser";
import { FileBrowser } from "./FileBrowser";
import { Login } from "./Login";
import { Register } from "./Register";

export const registerLazyRoute = createLazyRoute("/auth/register")({
  component: Register,
});

export const loginLazyRoute = createLazyRoute("/auth/login")({
  component: Login,
});

export const bucketBrowserLazyRoute = createLazyRoute("/buckets")({
  component: BucketBrowser,
});

export const fileBrowserLazyRoute = createLazyRoute("/browser/{-$path}")({
  component: FileBrowser,
});

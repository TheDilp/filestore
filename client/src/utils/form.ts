import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { Button, Input } from "../components";
const { fieldContext, formContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
});

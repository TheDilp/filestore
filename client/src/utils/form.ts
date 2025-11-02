import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { Button, Input, Select } from "../components";
const { fieldContext, formContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
    Select,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
});

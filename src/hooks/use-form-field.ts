import * as React from 'react';
import {
  ControllerFieldState,
  FieldPath,
  FieldValues,
  useFormContext,
} from 'react-hook-form';

// --- FormFieldContext ---
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// --- FormItemContext ---
type FormItemContextValue = {
  id: string;
};

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// --- useFormField Hook ---
export const useFormField = (): {
  id: string;
  name: FieldPath<FieldValues>;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
} & ControllerFieldState => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }
  if (!itemContext) {
    // Added check for itemContext as well, as it's used for the id
    throw new Error('useFormField should be used within <FormItem>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};
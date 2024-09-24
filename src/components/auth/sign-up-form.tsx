'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().required('Email is required').email(),
  password: yup.string().required('Password is required').min(6, 'Password should need to be at least 6 characters'),
  contactNumbers: yup
    .array()
    .of(yup.string().required('Contact number is required'))
    .min(1, 'At least one contact number is required'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumbers: string[];
  terms: boolean;
}

const defaultValues: Values = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  contactNumbers: [],
  terms: false,
};

export function SignUpForm(): React.JSX.Element {
  const router = useRouter();

  const { checkSession } = useUser();

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactNumbers',
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.signUp(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      // Refresh the auth state
      await checkSession?.();

      // UserProvider, for this case, will not refresh the router
      // After refresh, GuestGuard will handle the redirect
      router.refresh();
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Sign up</Typography>
        <Typography color="text.secondary" variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
            Sign in
          </Link>
        </Typography>
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Stack spacing={2}>
            <Typography variant="body1">User Details</Typography>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.firstName)}>
                  <InputLabel>First name</InputLabel>
                  <OutlinedInput {...field} label="First name" />
                  {errors.firstName ? <FormHelperText>{errors.firstName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.firstName)}>
                  <InputLabel>Last name</InputLabel>
                  <OutlinedInput {...field} label="Last name" />
                  {errors.firstName ? <FormHelperText>{errors.firstName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
          </Stack>
          <Stack spacing={2}>
            <Typography variant="body1">Login Details</Typography>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>Email address</InputLabel>
                  <OutlinedInput {...field} label="Email address" type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <FormControl error={Boolean(errors.password)}>
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput {...field} label="Password" type="password" />
                  {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
          </Stack>

          {/* Dynamic Contact Numbers Fields */}
          <Stack spacing={2}>
            <Typography variant="body1">Contact Details</Typography>
            {fields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={2} alignItems="center" justifyContent="flex-start">
                <Stack flex={1}>
                  <Controller
                    control={control}
                    name={`contactNumbers.${index}`}
                    render={({ field: contactNumberField }) => (
                      <FormControl error={Boolean(errors.contactNumbers?.[index])}>
                        <InputLabel>Contact Number</InputLabel>
                        <OutlinedInput {...contactNumberField} label="Contact Number" />
                        {errors.contactNumbers?.[index] ? (
                          <FormHelperText>{errors.contactNumbers[index]?.message}</FormHelperText>
                        ) : null}
                      </FormControl>
                    )}
                  />
                </Stack>
                <Button
                  onClick={() => {
                    remove(index);
                  }}
                  disabled={fields.length === 1}
                >
                  Remove
                </Button>
              </Stack>
            ))}
            <Button
              onClick={() => {
                append('');
              }}
            >
              Add Contact Number
            </Button>
          </Stack>
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <div>
                <FormControlLabel
                  control={<Checkbox {...field} />}
                  label={
                    <React.Fragment>
                      I have read the <Link>terms and conditions</Link>
                    </React.Fragment>
                  }
                />
                {errors.terms ? <FormHelperText error>{errors.terms.message}</FormHelperText> : null}
              </div>
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={isPending} type="submit" variant="contained">
            Sign up
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

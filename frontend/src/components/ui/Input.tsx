import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const inputClassName = (error: string | undefined, className: string | undefined) =>
  cn(
    'focus-ring h-11 w-full rounded-fieldops border bg-surface px-3.5 text-sm text-text placeholder:text-muted/70 focus:border-primary disabled:bg-app-bg',
    error ? 'border-danger' : 'border-border',
    className,
  )

const Field = ({
  id,
  label,
  error,
  children,
}: {
  id?: string
  label: string
  error?: string
  children: ReactNode
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-text">
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} className="text-xs text-danger">
        {error}
      </p>
    )}
  </div>
)

/**
 * Controlled `type="date"` input. A native date input only reports a value
 * through `onChange` once the whole date is valid (YYYY-MM-DD); while the user
 * types dd/mm/yyyy it reports an empty string. If we feed that empty string
 * straight back into a URL-/state-controlled value, React resets the field on
 * every keystroke, so segment-to-segment tabbing breaks and typing the year
 * wipes the day and month. To avoid that we keep the typed value in local
 * state and only propagate to the owner when the date is complete (or cleared),
 * while still syncing when the controlled value changes from the outside.
 */
const DateInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, label, value, onChange, ...props }, ref) => {
    const controlledValue = typeof value === 'string' ? value : ''
    const [draft, setDraft] = useState(controlledValue)
    // Resync the local draft when the controlled value changes from the outside
    // (e.g. a cleared filter). Adjusting state during render is the React-
    // recommended way to derive state from props without an effect.
    const [lastControlledValue, setLastControlledValue] = useState(controlledValue)
    if (controlledValue !== lastControlledValue) {
      setLastControlledValue(controlledValue)
      setDraft(controlledValue)
    }

    return (
      <Field id={id} label={label} error={error}>
        <input
          id={id}
          ref={ref}
          type="date"
          className={inputClassName(error, className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            // Only notify the owner with complete (valid) or cleared values so a
            // URL-/state-controlled parent never resets a half-typed date.
            if (event.target.value === '' || !Number.isNaN(Date.parse(event.target.value))) {
              onChange?.(event)
            }
          }}
          {...props}
        />
      </Field>
    )
  },
)
DateInput.displayName = 'DateInput'

/**
 * `type="password"` input with a visibility toggle button.
 * Clicking the eye icon switches the input between `password` and `text`
 * so the user can verify what they typed without clearing the field.
 */
const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, label, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <Field id={id} label={label} error={error}>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={cn(inputClassName(error, className), 'pr-10')}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  if (props.type === 'date') {
    return <DateInput {...props} ref={ref} />
  }

  if (props.type === 'password') {
    return <PasswordInput {...props} ref={ref} />
  }

  const { className, error, id, label, ...rest } = props
  return (
    <Field id={id} label={label} error={error}>
      <input
        id={id}
        ref={ref}
        className={inputClassName(error, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
    </Field>
  )
})
Input.displayName = 'Input'

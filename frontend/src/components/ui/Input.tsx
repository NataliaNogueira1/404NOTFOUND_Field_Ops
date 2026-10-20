import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
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

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  if (props.type === 'date') {
    return <DateInput {...props} ref={ref} />
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

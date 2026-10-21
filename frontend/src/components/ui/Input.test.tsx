import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Input } from './Input'

afterEach(() => {
  cleanup()
})

describe('Input — password toggle', () => {
  it('renders the toggle button with aria-label "Mostrar senha" initially', () => {
    render(<Input label="Senha" id="pwd" type="password" />)

    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(toggle).toBeInTheDocument()
  })

  it('toggle button has type="button" so it does not submit a form', () => {
    render(<Input label="Senha" id="pwd" type="password" />)

    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(toggle).toHaveAttribute('type', 'button')
  })

  it('clicking the toggle switches the input to type="text" and updates aria-label', () => {
    render(<Input label="Senha" id="pwd" type="password" />)

    // Initially: toggle shows 'Mostrar senha' (password is hidden)
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    // After click: the aria-label changes to 'Ocultar senha' (password is visible)
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()
    // The toggle button no longer reads 'Mostrar senha'
    expect(screen.queryByRole('button', { name: 'Mostrar senha' })).not.toBeInTheDocument()
  })

  it('clicking the toggle a second time restores type="password" and aria-label', () => {
    render(<Input label="Senha" id="pwd" type="password" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))

    expect(screen.getByLabelText('Senha', { selector: 'input' })).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument()
  })

  it('a regular type="text" input does NOT render the toggle button', () => {
    render(<Input label="Nome" id="name" type="text" />)

    expect(screen.queryByRole('button', { name: /mostrar senha|ocultar senha/i })).not.toBeInTheDocument()
  })
})

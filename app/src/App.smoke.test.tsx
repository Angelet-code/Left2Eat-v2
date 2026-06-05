import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './storage/schema';

describe('Left2Eat smoke flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('navigates tabs, favorites food, adds a meal and persists state', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    expect(await screen.findByRole('main', { name: 'Hoy' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hoy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Te quedan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Día anterior/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Día siguiente/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar día/i })).toBeDisabled();

    await user.click(within(nav).getByRole('button', { name: /Alimentos/i }));
    expect(screen.getByRole('heading', { name: 'Alimentos' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Buscar alimento o alias'), 'salmon');
    await user.click(screen.getByRole('button', { name: /Salmón/i }));
    await user.click(screen.getByRole('button', { name: /Marcar favorito/i }));
    expect(screen.getByRole('button', { name: /Favorito/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Volver/i }));
    await user.click(within(nav).getByRole('button', { name: /^Hoy$/i }));
    await user.click(screen.getByRole('button', { name: /Añadir comida/i }));
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Recomendados' })).toBeInTheDocument();
    const macroFilter = within(dialog).getByRole('group', { name: 'Filtrar alimentos' });
    await user.click(within(macroFilter).getByRole('button', { name: /Proteína/i }));
    expect(within(dialog).getByRole('button', { name: /Pechuga de pollo/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Arroz cocido/i })).not.toBeInTheDocument();
    await user.click(within(macroFilter).getByRole('button', { name: /Todos/i }));

    await user.type(screen.getByPlaceholderText('Buscar alimento o alias'), 'arroz');
    await user.click(screen.getByRole('button', { name: /Arroz cocido/i }));
    await user.clear(screen.getByPlaceholderText('Buscar alimento o alias'));
    await user.type(screen.getByPlaceholderText('Buscar alimento o alias'), 'huevo');
    await user.click(screen.getByRole('button', { name: /^Huevo/i }));

    await user.click(screen.getByRole('button', { name: /Continuar/i }));
    expect(screen.getByText(/1 de 2 alimentos/i)).toBeInTheDocument();
    dialog = screen.getByRole('dialog');
    const quantityInput = within(dialog).getByRole('spinbutton', { name: 'Cantidad' });
    await user.clear(quantityInput);
    await user.type(quantityInput, '100');
    await user.click(within(dialog).getByRole('button', { name: /^Siguiente$/i }));
    dialog = screen.getByRole('dialog');
    await user.clear(within(dialog).getByRole('spinbutton', { name: 'Cantidad' }));
    await user.type(within(dialog).getByRole('spinbutton', { name: 'Cantidad' }), '60');
    await user.click(within(dialog).getByRole('button', { name: /Registrar comida/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Arroz cocido con huevo/i)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('arroz-cocido');
    const registerButton = screen.getByRole('button', { name: /Registrar día/i });
    expect(registerButton).toBeEnabled();
    await user.click(registerButton);
    expect(screen.getByRole('status')).toHaveTextContent('Día registrado');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('registeredDays');
    expect(screen.getByRole('button', { name: /Registrar día/i })).toBeDisabled();
    expect(screen.queryByText(/Arroz cocido con huevo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Añade tu primera comida/i)).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: /Historial/i }));
    expect(screen.getByText(/Arroz cocido con huevo/i)).toBeInTheDocument();
    await user.click(within(nav).getByRole('button', { name: /^Hoy$/i }));
    expect(localStorage.getItem(STORAGE_KEY)).toContain('salmon');
  });

  it('closes the registered day popup after two seconds', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Añadir comida/i }));
    await user.click(screen.getByRole('button', { name: /Arroz cocido/i }));
    await user.click(screen.getByRole('button', { name: /Continuar/i }));
    await user.click(screen.getByRole('button', { name: /Registrar comida/i }));
    await user.click(screen.getByRole('button', { name: /Registrar día/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Día registrado');

    await waitForElementToBeRemoved(() => screen.queryByRole('status'), { timeout: 3500 });
  });

  it('shows profile and history tabs', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('button', { name: /Perfil/i }));
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar perfil/i })).toBeDisabled();

    await user.click(within(nav).getByRole('button', { name: /Historial/i }));
    expect(screen.getByRole('heading', { name: 'Historial' })).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay días registrados/i)).toBeInTheDocument();
  });
});

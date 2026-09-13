import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the unauthenticated login interface', () => {
  render(<App />);

  expect(
    screen.getByRole('textbox', { name: /root account email or alias/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

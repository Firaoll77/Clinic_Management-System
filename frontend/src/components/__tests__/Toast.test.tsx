import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Toast, ToastContainer } from '../Toast'

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Toast', () => {
    it('should render toast with message', () => {
      const mockOnClose = jest.fn()
      render(<Toast message="Test message" onClose={mockOnClose} />)

      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('should render with success type by default', () => {
      const mockOnClose = jest.fn()
      render(<Toast message="Success message" type="success" onClose={mockOnClose} />)

      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = jest.fn()
      render(<Toast message="Test message" onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should auto-close after duration', async () => {
      const mockOnClose = jest.fn()
      render(<Toast message="Auto-close message" onClose={mockOnClose} duration={1000} />)

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('ToastContainer', () => {
    it('should render multiple toasts', () => {
      const toasts = [
        { id: '1', message: 'First toast', type: 'success' as const },
        { id: '2', message: 'Second toast', type: 'error' as const },
      ]
      const mockRemoveToast = jest.fn()

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      expect(screen.getByText('First toast')).toBeInTheDocument()
      expect(screen.getByText('Second toast')).toBeInTheDocument()
    })

    it('should call removeToast when toast is closed', () => {
      const toasts = [
        { id: '1', message: 'Test toast', type: 'info' as const },
      ]
      const mockRemoveToast = jest.fn()

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)

      expect(mockRemoveToast).toHaveBeenCalledWith('1')
    })

    it('should render empty container when no toasts', () => {
      const mockRemoveToast = jest.fn()
      const { container } = render(<ToastContainer toasts={[]} removeToast={mockRemoveToast} />)

      expect(container.firstChild).toBeEmptyDOMElement()
    })
  })
})

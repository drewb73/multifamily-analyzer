// File Location: src/components/settings/team/SeatManagementCard.tsx
// Component to manage workspace seats - with admin support

'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Minus, ShoppingCart, AlertCircle, Loader2, Check, Crown } from 'lucide-react';

interface SeatManagementCardProps {
  seats: {
    purchased: number;
    used: number;
    available: number;
  };
  onRefresh: () => void;
}

export function SeatManagementCard({ seats, onRefresh }: SeatManagementCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<'purchase' | 'add' | 'remove' | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const SEAT_PRICE = 9.99;
  const MAX_SEATS = 25;

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/seats/info');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

  const handleOpenModal = (actionType: 'purchase' | 'add' | 'remove') => {
    setAction(actionType);
    setIsModalOpen(true);
    setQuantity(1);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAction(null);
    setQuantity(1);
    setError(null);
    setSuccess(null);
  };

  const handlePurchaseSeats = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/seats/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase seats');
      }

      setSuccess(`Successfully purchased ${quantity} seat${quantity > 1 ? 's' : ''}!`);
      setTimeout(() => {
        handleCloseModal();
        onRefresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSeats = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/seats/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalSeats: quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add seats');
      }

      setSuccess(`Successfully added ${quantity} seat${quantity > 1 ? 's' : ''}!`);
      setTimeout(() => {
        handleCloseModal();
        onRefresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSeats = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/seats/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatsToRemove: quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove seats');
      }

      setSuccess(`Successfully removed ${quantity} seat${quantity > 1 ? 's' : ''}!`);
      setTimeout(() => {
        handleCloseModal();
        onRefresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (action === 'purchase') {
      handlePurchaseSeats();
    } else if (action === 'add') {
      handleAddSeats();
    } else if (action === 'remove') {
      handleRemoveSeats();
    }
  };

  const getMaxQuantity = () => {
    if (action === 'purchase' || action === 'add') {
      return MAX_SEATS - seats.purchased;
    } else if (action === 'remove') {
      return seats.available;
    }
    return MAX_SEATS;
  };

  const monthlyCost = isAdmin ? 0 : seats.purchased * SEAT_PRICE;

  return (
    <>
      <div className="elevated-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-neutral-800">
              Seat Management
            </h2>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-50 border border-warning-200 rounded-full">
              <Crown className="w-4 h-4 text-warning-600" />
              <span className="text-xs font-semibold text-warning-700">Admin</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Seat Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary-700">{seats.purchased}</p>
              <p className="text-xs text-primary-600 mt-1">Purchased</p>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-neutral-700">{seats.used}</p>
              <p className="text-xs text-neutral-600 mt-1">In Use</p>
            </div>
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-success-700">{seats.available}</p>
              <p className="text-xs text-success-600 mt-1">Available</p>
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">Monthly Cost</p>
              <p className="text-xl font-bold text-neutral-900">
                {isAdmin ? (
                  <span className="text-success-700">FREE</span>
                ) : (
                  <>
                    ${monthlyCost.toFixed(2)}
                    <span className="text-sm font-normal text-neutral-600">/month</span>
                  </>
                )}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {isAdmin ? 'Admin accounts receive free seats' : `$${SEAT_PRICE}/seat per month`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {seats.purchased === 0 ? (
              <button
                onClick={() => handleOpenModal('purchase')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Purchase Seats
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenModal('add')}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add More Seats
                </button>
                {seats.available > 0 && (
                  <button
                    onClick={() => handleOpenModal('remove')}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Minus className="w-4 h-4" />
                    Remove Unused Seats
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              {action === 'purchase' && 'Purchase Seats'}
              {action === 'add' && 'Add More Seats'}
              {action === 'remove' && 'Remove Seats'}
            </h3>

            {isAdmin && (
              <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                <Crown className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning-700">
                  As an admin, seats are free for testing purposes.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-start gap-2">
                <Check className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-success-700">{success}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Number of Seats
                </label>
                <input
                  type="number"
                  min="1"
                  max={getMaxQuantity()}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(getMaxQuantity(), parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isProcessing}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {action === 'remove' 
                    ? `Maximum: ${seats.available} available seat${seats.available !== 1 ? 's' : ''}`
                    : `Maximum: ${MAX_SEATS - seats.purchased} more seat${MAX_SEATS - seats.purchased !== 1 ? 's' : ''}`
                  }
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    {action === 'remove' ? 'Monthly Savings' : 'Additional Monthly Cost'}
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {isAdmin ? 'FREE' : `$${(quantity * SEAT_PRICE).toFixed(2)}/month`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {action === 'purchase' && 'Purchase'}
                      {action === 'add' && 'Add'}
                      {action === 'remove' && 'Remove'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
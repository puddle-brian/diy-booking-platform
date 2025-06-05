'use client';

import React, { useState, useEffect } from 'react';

interface HoldRequest {
  id: string;
  showId?: string;
  showRequestId?: string;
  requestedById: string;
  respondedById?: string;
  duration: number;
  reason: string;
  customMessage?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'DECLINED';
  requestedAt: string;
  respondedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  requester_name?: string;
  responder_name?: string;
}

interface ActiveHoldDisplayProps {
  holdRequest: HoldRequest;
  otherPartyName: string;
  onEndEarly: () => void;
  onExpired: () => void;
}

export function ActiveHoldDisplay({ holdRequest, otherPartyName, onEndEarly, onExpired }: ActiveHoldDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!holdRequest.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(holdRequest.expiresAt!).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeRemaining(null);
        onExpired();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        total: difference
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [holdRequest.expiresAt, onExpired]);

  const formatTimeUnit = (value: number, unit: string) => {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{value.toString().padStart(2, '0')}</div>
        <div className="text-xs text-orange-100 uppercase tracking-wide">{unit}</div>
      </div>
    );
  };

  const getUrgencyColor = () => {
    if (!timeRemaining) return 'bg-gray-500';
    
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    
    if (totalHours <= 2) {
      return 'bg-gradient-to-r from-red-600 to-red-700'; // Critical
    } else if (totalHours <= 6) {
      return 'bg-gradient-to-r from-orange-600 to-orange-700'; // Warning
    } else {
      return 'bg-gradient-to-r from-green-600 to-green-700'; // Good
    }
  };

  if (!timeRemaining) {
    return (
      <div className="bg-gray-500 text-white rounded-lg p-6 mb-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">🕐 Hold Expired</h3>
          <p className="text-gray-200">The negotiation hold has ended</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getUrgencyColor()} text-white rounded-lg p-6 mb-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <span className="text-2xl">🔒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">ACTIVE HOLD - EXCLUSIVE NEGOTIATION</h3>
            <p className="text-white/90 text-sm">
              Competing offers are blocked • No other bookings can be made for this date
            </p>
          </div>
        </div>
        <button
          onClick={onEndEarly}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          End Early
        </button>
      </div>

      {/* Countdown Timer */}
      <div className="bg-black/20 rounded-lg p-4 mb-4">
        <div className="text-center mb-3">
          <p className="text-white/90 text-sm">HOLD EXPIRES IN</p>
        </div>
        <div className="flex justify-center space-x-6">
          {formatTimeUnit(timeRemaining.hours, 'HOURS')}
          <div className="self-center text-white/60 text-xl">:</div>
          {formatTimeUnit(timeRemaining.minutes, 'MINUTES')}
          <div className="self-center text-white/60 text-xl">:</div>
          {formatTimeUnit(timeRemaining.seconds, 'SECONDS')}
        </div>
      </div>

      {/* Hold Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-white/70 mb-1">Requested by:</p>
          <p className="font-medium">{holdRequest.requester_name || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-white/70 mb-1">Reason:</p>
          <p className="font-medium">{holdRequest.reason}</p>
        </div>
        {holdRequest.customMessage && (
          <div className="md:col-span-2">
            <p className="text-white/70 mb-1">Additional message:</p>
            <p className="italic">{holdRequest.customMessage}</p>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="flex items-start space-x-2 text-sm">
          <span className="text-white/80">💡</span>
          <div className="text-white/90">
            <strong>Next steps:</strong> Use this exclusive time to finalize show details, 
            review requirements, and make your decision. Remember to communicate directly 
            with {otherPartyName} about any questions or concerns.
          </div>
        </div>
      </div>
    </div>
  );
} 
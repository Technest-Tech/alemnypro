<?php

namespace App\Services;

use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Debit the wallet and record a hold transaction.
     */
    public function hold(User $user, float $amount, Model $reference, ?string $descEn = null, ?string $descAr = null): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amount, $reference, $descEn, $descAr) {
            $user->refresh(); // getting the latest balance
            
            // In a real implementation we would check for enough funds unless it's a direct payment integration
            // $user->wallet_balance -= $amount;
            // For MVP we just track the ledger regardless of negatives.

            $sessionBalance = $user->wallet_balance - $amount;
            $user->update(['wallet_balance' => $sessionBalance]);

            return $user->walletTransactions()->create([
                'type' => 'hold',
                'amount' => -$amount,
                'balance_after' => $sessionBalance,
                'reference_type' => get_class($reference),
                'reference_id' => $reference->id,
                'description_en' => $descEn ?: 'Funds held in escrow',
                'description_ar' => $descAr ?: 'تم احتجاز الأموال لحجز',
            ]);
        });
    }

    /**
     * Credit the wallet from a released hold.
     */
    public function release(User $user, float $amount, Model $reference, ?string $descEn = null, ?string $descAr = null): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amount, $reference, $descEn, $descAr) {
            $user->refresh();
            
            $sessionBalance = $user->wallet_balance + $amount;
            $user->update(['wallet_balance' => $sessionBalance]);

            return $user->walletTransactions()->create([
                'type' => 'release',
                'amount' => $amount,
                'balance_after' => $sessionBalance,
                'reference_type' => get_class($reference),
                'reference_id' => $reference->id,
                'description_en' => $descEn ?: 'Funds released from escrow',
                'description_ar' => $descAr ?: 'تم تحرير الأموال المدفوعة',
            ]);
        });
    }

    /**
     * Refund a user.
     */
    public function refund(User $user, float $amount, Model $reference, ?string $descEn = null, ?string $descAr = null): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amount, $reference, $descEn, $descAr) {
            $user->refresh();
            
            $sessionBalance = $user->wallet_balance + $amount;
            $user->update(['wallet_balance' => $sessionBalance]);

            return $user->walletTransactions()->create([
                'type' => 'refund',
                'amount' => $amount,
                'balance_after' => $sessionBalance,
                'reference_type' => get_class($reference),
                'reference_id' => $reference->id,
                'description_en' => $descEn ?: 'Refund processed',
                'description_ar' => $descAr ?: 'تم استرداد الأموال',
            ]);
        });
    }

    /**
     * Apply penalty to tutor.
     */
    public function applyPenalty(User $user, float $amount, Model $reference, ?string $descEn = null, ?string $descAr = null): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amount, $reference, $descEn, $descAr) {
            $user->refresh();
            
            $sessionBalance = $user->wallet_balance - $amount;
            $user->update(['wallet_balance' => $sessionBalance]);

            return $user->walletTransactions()->create([
                'type' => 'penalty',
                'amount' => -$amount,
                'balance_after' => $sessionBalance,
                'reference_type' => get_class($reference),
                'reference_id' => $reference->id,
                'description_en' => $descEn ?: 'Cancellation penalty applied',
                'description_ar' => $descAr ?: 'تم تطبيق غرامة إلغاء',
            ]);
        });
    }
}

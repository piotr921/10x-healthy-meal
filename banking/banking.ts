import {
    BankAccount,
    WithdrawalRequest,
    WithdrawalResult,
    WithdrawalError,
} from "./types";

function generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createAccount(account: BankAccount): BankAccount | WithdrawalError {
    if (account.balance < 0) {
        return {
            code: "INVALID_AMOUNT",
            message: "Account balance cannot be negative"
        };
    }

    if (account.balance === 0) {
        return {
            code: "INVALID_AMOUNT",
            message: "Initial account balance must be positive"
        };
    }

    return account;
}

export function processWithdrawal(
    account: BankAccount,
    withdrawal: WithdrawalRequest
): WithdrawalResult | WithdrawalError {
    if (withdrawal.accountId !== account.id) {
        return {
            code: "ACCOUNT_NOT_FOUND",
            message: "Account not found"
        };
    }

    if (withdrawal.amount <= 0) {
        return {
            code: "INVALID_AMOUNT",
            message: "Withdrawal amount must be positive"
        };
    }

    if (withdrawal.currency !== account.currency) {
        return {
            code: "INVALID_AMOUNT",
            message: "Currency mismatch"
        };
    }

    if (withdrawal.amount > account.balance) {
        return {
            code: "INSUFFICIENT_FUNDS",
            message: "Insufficient funds"
        };
    }

    const remainingBalance = account.balance - withdrawal.amount;

    return {
        success: true,
        transaction: {
            id: generateTransactionId(),
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            timestamp: withdrawal.timestamp,
            remainingBalance: remainingBalance
        }
    };
}

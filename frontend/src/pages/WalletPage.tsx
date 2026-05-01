import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Lock, Copy, Check } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, truncateAddress, formatRelativeTime } from '../lib/utils'
import { MOCK_WALLET_BALANCES } from '../lib/mockData'

export default function WalletPage() {
  const { transactions, balancesMasked, toggleBalanceMask, user } = useAppStore()
  const [copiedAddress, setCopiedAddress] = useState(false)

  const totalUSD = MOCK_WALLET_BALANCES.reduce((a, b) => a + (b.usdValue ?? 0), 0)

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress).catch(() => {})
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  return (
    <AppLayout pageTitle="Private Wallet" pageSubtitle="Encrypted balances and transaction history">
      <div className="space-y-5 w-full">
        {/* Hero balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.4), transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Total Portfolio Value</p>
                <motion.div
                  className={`text-4xl font-bold ${balancesMasked ? 'privacy-mask' : 'gradient-text'}`}
                  animate={{ filter: balancesMasked ? 'blur(8px)' : 'blur(0px)' }}
                  transition={{ duration: 0.3 }}
                >
                  {formatAmount(totalUSD)}
                </motion.div>
                <p className="text-sm text-zinc-500 mt-1">Encrypted via Umbra Protocol</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleBalanceMask}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}
                >
                  {balancesMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {balancesMasked ? 'Show' : 'Hide'}
                </motion.button>
              </div>
            </div>

            {/* Wallet address */}
            {user?.walletAddress && (
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="text-xs font-mono text-zinc-400">{truncateAddress(user.walletAddress, 8)}</span>
                <button onClick={copyAddress} className="p-1 rounded hover:bg-white/5 transition-colors">
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Token balances */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Token Balances</h3>
          <div className="space-y-2">
            {MOCK_WALLET_BALANCES.map((bal, i) => (
              <motion.div
                key={bal.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-hover p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: `hsl(${i * 80 + 260}, 70%, 40%)` }}>
                  {bal.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{bal.token}</div>
                  <div className="text-xs text-zinc-500">{bal.symbol}</div>
                </div>
                <div className="text-right">
                  <motion.div
                    className="text-sm font-bold text-white"
                    animate={{ filter: balancesMasked ? 'blur(6px)' : 'blur(0px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {balancesMasked ? '••••••' : formatAmount(bal.usdValue ?? 0)}
                  </motion.div>
                  <div className="text-xs text-zinc-500">
                    {balancesMasked ? '••••' : `${bal.balance?.toLocaleString()} ${bal.symbol}`}
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 w-16 justify-end
                  ${(bal.percentChange24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(bal.percentChange24h ?? 0) >= 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(bal.percentChange24h ?? 0)}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Transaction History</h3>
            <span className="badge-private"><Lock className="w-2.5 h-2.5" /> All encrypted</span>
          </div>
          <div className="glass-card divide-y divide-white/5">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-4 py-3 table-row-hover"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${tx.type === 'payroll' ? 'bg-violet-500/10' : 'bg-indigo-500/10'}`}>
                  {tx.type === 'payroll'
                    ? <ArrowUpRight className="w-4 h-4 text-violet-400" />
                    : <ArrowDownLeft className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{tx.memo ?? tx.type}</div>
                  <div className="text-xs font-mono text-zinc-600 truncate">{tx.txHash.slice(0, 24)}...</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <motion.div
                    className="text-xs font-mono text-zinc-500"
                    animate={{ filter: balancesMasked ? 'blur(4px)' : 'blur(0px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {tx.encryptedAmount.slice(0, 14)}...
                  </motion.div>
                  <div className="text-[10px] text-zinc-600">{formatRelativeTime(tx.timestamp)}</div>
                </div>
                <span className={tx.status === 'confirmed' ? 'badge-success' : 'badge-warning'}>{tx.status}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

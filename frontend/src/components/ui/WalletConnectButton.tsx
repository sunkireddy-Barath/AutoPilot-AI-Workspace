import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { truncateAddress } from '../../lib/utils'

export function WalletConnectButton() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="flex items-center gap-3">
      {connected && publicKey && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-violet-300">{truncateAddress(publicKey.toBase58())}</span>
        </div>
      )}
      <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !border !border-white/10 !rounded-xl !h-9 !px-4 !text-xs !font-medium !transition-all !leading-none" />
    </div>
  )
}

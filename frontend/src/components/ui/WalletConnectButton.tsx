import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletConnectButton() {
  const { connected } = useWallet()

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
        <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !border !border-white/10 !rounded-xl !h-9 !px-4 !text-xs !font-medium !transition-all !leading-none !relative" />
      </div>
      
      {!connected && (
        <button 
          onClick={() => alert("Troubleshooting Tips:\n1. Disable MetaMask temporarily (it can conflict with Phantom).\n2. Perform a Hard Refresh (Ctrl+F5 or Cmd+Shift+R).\n3. Ensure your wallet is set to Devnet or Mainnet as required.")}
          className="text-[10px] text-zinc-600 hover:text-violet-400 transition-colors mr-1"
        >
          Trouble connecting?
        </button>
      )}
    </div>
  )
}

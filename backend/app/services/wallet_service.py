import random

class WalletService:
    @staticmethod
    def get_balances(wallet_address: str):
        """
        Simulates fetching real-time token balances from the Solana blockchain.
        In a production app, this would use the Solana RPC getTokenAccountsByOwner.
        """
        # Deterministic seed based on address for "persistent" mocks
        seed = sum(ord(c) for c in (wallet_address or "default"))
        random.seed(seed)
        
        tokens = [
            {"token": "Solana", "symbol": "SOL", "amount": random.uniform(10, 500)},
            {"token": "USD Coin", "symbol": "USDC", "amount": random.uniform(5000, 50000)},
            {"token": "Tether", "symbol": "USDT", "amount": random.uniform(1000, 10000)},
            {"token": "Umbra Protocol", "symbol": "UMBRA", "amount": random.uniform(100, 5000)},
        ]
        
        # Simulated price data
        prices = {"SOL": 145.20, "USDC": 1.00, "USDT": 1.00, "UMBRA": 2.45}
        
        for t in tokens:
            t["price"] = prices.get(t["symbol"], 0)
            t["usdValue"] = t["amount"] * t["price"]
            t["percentChange24h"] = random.uniform(-5, 10)
            
        return tokens

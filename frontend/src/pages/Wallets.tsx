import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

type Wallet = {
  address: string;
  balance: string;
  transactionCount: number;
  walletType: string;
  status: string;
};

function Wallets() {
  const [wallets, setWallets] =
    useState<Wallet[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchWallets =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "http://localhost:5000/api/blockchain/wallets"
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch wallets"
          );
        }

        const result =
          await response.json();

        setWallets(
          result.wallets || []
        );

      } catch (error) {
        console.error(
          "Wallet fetch error:",
          error
        );

        setError(
          "Unable to load wallet data"
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchWallets();
  }, []);


  if (loading) {
    return (
      <div className="page-container">
        <h1>Wallets</h1>

        <p>
          Loading Ganache wallets...
        </p>
      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h1>Wallets</h1>

          <p>
            Real accounts from the
            Ganache Ethereum network
          </p>
        </div>

        <button
          className="verify-button"
          onClick={fetchWallets}
        >
          Refresh Wallets
        </button>
      </div>


      {error && (
        <p>{error}</p>
      )}


      <div className="table-container">

        <table>

          <thead>
            <tr>
              <th>Address</th>
              <th>Balance</th>
              <th>Transactions</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>


          <tbody>

            {wallets.map(
              (wallet) => (
                <tr
                  key={
                    wallet.address
                  }
                >

                  <td>
                    <Link
                      to={`/wallet/${wallet.address}`}
                    >
                      {
                        wallet.address
                      }
                    </Link>
                  </td>

                  <td>
                    {
                      wallet.balance
                    } ETH
                  </td>

                  <td>
                    {
                      wallet.transactionCount
                    }
                  </td>

                  <td>
                    {
                      wallet.walletType
                    }
                  </td>

                  <td>
                    {
                      wallet.status
                    }
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Wallets;
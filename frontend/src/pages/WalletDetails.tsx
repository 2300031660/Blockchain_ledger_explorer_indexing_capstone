import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Transaction = {
  hash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  amount: string;
  status: string;
};

type Wallet = {
  address: string;
  balance: string;
  sentCount: number;
  receivedCount: number;
  totalTransactions: number;
  walletType: string;
  status: string;
};

type WalletResponse = {
  success: boolean;
  wallet: Wallet;
  sentTransactions: Transaction[];
  receivedTransactions: Transaction[];
};

function WalletDetails() {
  const { address } = useParams<{ address: string }>();

  const [data, setData] =
    useState<WalletResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchWalletDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/blockchain/wallets/${address}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch wallet details"
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "Wallet request failed"
          );
        }

        setData(result);
      } catch (error) {
        console.error(
          "Wallet details error:",
          error
        );

        setError(
          "Unable to load wallet details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchWalletDetails();
    }
  }, [address]);

  if (loading) {
    return (
      <div className="page-container">
        <h1>Wallet Details</h1>

        <p>
          Loading wallet details...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div
          style={{
            padding: "20px",
            background: "#fff3cd",
            border: "1px solid #ffe69c",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          ⚠{" "}
          {error ||
            "Wallet information unavailable."}
        </div>

        <Link to="/wallets">
          ← Back to Wallets
        </Link>
      </div>
    );
  }

  const wallet = data.wallet;

  return (
    <div className="page-container">

      <Link to="/wallets">
        ← Back to Wallets
      </Link>

      <h1 style={{ marginTop: "20px" }}>
        Wallet Details
      </h1>

      <div className="dashboard-summary">

        <h2>Account Information</h2>

        <div className="summary-row">
          <span>Wallet Address</span>
          <strong>{wallet.address}</strong>
        </div>

        <div className="summary-row">
          <span>Balance</span>
          <strong>
            {wallet.balance} ETH
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Total Transactions
          </span>
          <strong>
            {wallet.totalTransactions}
          </strong>
        </div>

        <div className="summary-row">
          <span>Sent Transactions</span>
          <strong>
            {wallet.sentCount}
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Received Transactions
          </span>
          <strong>
            {wallet.receivedCount}
          </strong>
        </div>

        <div className="summary-row">
          <span>Wallet Type</span>
          <strong>
            {wallet.walletType}
          </strong>
        </div>

        <div className="summary-row">
          <span>Status</span>
          <strong>
            {wallet.status}
          </strong>
        </div>

      </div>

      <div className="dashboard-summary">

        <h2>Sent Transactions</h2>

        {data.sentTransactions.length === 0 ? (
          <p>No sent transactions.</p>
        ) : (
          <div className="table-container">

            <table>
              <thead>
                <tr>
                  <th>Hash</th>
                  <th>Block</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.sentTransactions.map(
                  (transaction) => (
                    <tr key={transaction.hash}>

                      <td>
                        <Link
                          to={`/transaction/${transaction.hash}`}
                        >
                          {transaction.hash}
                        </Link>
                      </td>

                      <td>
                        <Link
                          to={`/block/${transaction.blockNumber}`}
                        >
                          #{transaction.blockNumber}
                        </Link>
                      </td>

                      <td>
                        {transaction.to ||
                          "Contract Creation"}
                      </td>

                      <td>
                        {transaction.amount} ETH
                      </td>

                      <td>
                        {transaction.status}
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>

          </div>
        )}

      </div>

      <div className="dashboard-summary">

        <h2>Received Transactions</h2>

        {data.receivedTransactions.length === 0 ? (
          <p>
            No received transactions.
          </p>
        ) : (
          <div className="table-container">

            <table>
              <thead>
                <tr>
                  <th>Hash</th>
                  <th>Block</th>
                  <th>From</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.receivedTransactions.map(
                  (transaction) => (
                    <tr key={transaction.hash}>

                      <td>
                        <Link
                          to={`/transaction/${transaction.hash}`}
                        >
                          {transaction.hash}
                        </Link>
                      </td>

                      <td>
                        <Link
                          to={`/block/${transaction.blockNumber}`}
                        >
                          #{transaction.blockNumber}
                        </Link>
                      </td>

                      <td>
                        {transaction.from}
                      </td>

                      <td>
                        {transaction.amount} ETH
                      </td>

                      <td>
                        {transaction.status}
                      </td>

                    </tr>
                  )
                )}
              </tbody>
            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default WalletDetails;
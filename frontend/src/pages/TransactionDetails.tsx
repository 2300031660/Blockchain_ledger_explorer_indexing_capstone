import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

type Transaction = {
  id: number;
  hash: string;
  block_number: number;
  from_address: string;
  to_address: string;
  amount: string;
  status: string;
  created_at: string;
};

function TransactionDetails() {
  const { hash } = useParams();

  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/transactions/${hash}`
        );

        if (!response.ok) {
          throw new Error("Transaction not found");
        }

        const data = await response.json();

        setTransaction(data.transaction);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load transaction details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (hash) {
      fetchTransaction();
    }
  }, [hash]);

  if (loading) {
    return (
      <main className="page-container">
        <div className="details-card">
          Loading transaction details...
        </div>
      </main>
    );
  }

  if (error || !transaction) {
    return (
      <main className="page-container">
        <div className="verification-warning">
          ⚠ {error || "Transaction not found"}
        </div>

        <br />

        <Link to="/transactions">
          Back to Transactions
        </Link>
      </main>
    );
  }

  return (
    <main className="page-container">

      <div className="page-heading">
        <h1>Transaction Details</h1>

        <p>
          Detailed information for blockchain
          transaction.
        </p>
      </div>

      <section className="verification-details">

        <div className="section-header">
          <h2>Transaction Information</h2>
        </div>

        <div className="details-card">

          <div className="detail-row">
            <span>Transaction Hash</span>
            <strong>
              {transaction.hash}
            </strong>
          </div>

          <div className="detail-row">
            <span>Block Number</span>

            <strong>
              <Link
                to={`/block/${transaction.block_number}`}
              >
                {transaction.block_number}
              </Link>
            </strong>
          </div>

          <div className="detail-row">
            <span>From Address</span>

            <strong>
              <Link
                to={`/wallet/${transaction.from_address}`}
              >
                {transaction.from_address}
              </Link>
            </strong>
          </div>

          <div className="detail-row">
            <span>To Address</span>

            <strong>
              <Link
                to={`/wallet/${transaction.to_address}`}
              >
                {transaction.to_address}
              </Link>
            </strong>
          </div>

          <div className="detail-row">
            <span>Amount</span>

            <strong>
              {Number(
                transaction.amount
              ).toFixed(2)} ETH
            </strong>
          </div>

          <div className="detail-row">
            <span>Status</span>

            <strong
              className={
                transaction.status === "Success"
                  ? "detail-success"
                  : transaction.status === "Failed"
                  ? "detail-error"
                  : ""
              }
            >
              {transaction.status}
            </strong>
          </div>

          <div className="detail-row">
            <span>Created At</span>

            <strong>
              {new Date(
                transaction.created_at
              ).toLocaleString()}
            </strong>
          </div>

        </div>
      </section>

      <div style={{ marginTop: "20px" }}>
        <Link to="/transactions">
          ← Back to Transactions
        </Link>
      </div>

    </main>
  );
}

export default TransactionDetails;
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

type Block = {
  id: number;
  block_number: number;
  block_hash: string;
  validator: string;
  transaction_count: number;
  gas_used: string;
  status: string;
  created_at: string;
};

function BlockDetails() {
  const { number } = useParams();

  const [block, setBlock] =
    useState<Block | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/blocks/${number}`
        );

        if (!response.ok) {
          throw new Error("Block not found");
        }

        const data = await response.json();

        setBlock(data.block);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load block details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (number) {
      fetchBlock();
    }
  }, [number]);

  if (loading) {
    return (
      <main className="page-container">
        <div className="details-card">
          Loading block details...
        </div>
      </main>
    );
  }

  if (error || !block) {
    return (
      <main className="page-container">

        <div className="verification-warning">
          ⚠ {error || "Block not found"}
        </div>

        <br />

        <Link to="/blocks">
          ← Back to Blocks
        </Link>

      </main>
    );
  }

  return (
    <main className="page-container">

      <div className="page-heading">
        <h1>Block Details</h1>

        <p>
          Detailed information about blockchain block{" "}
          {block.block_number}.
        </p>
      </div>

      <section className="verification-details">

        <div className="section-header">
          <h2>Block Information</h2>
        </div>

        <div className="details-card">

          <div className="detail-row">
            <span>Block Number</span>

            <strong>
              {block.block_number}
            </strong>
          </div>

          <div className="detail-row">
            <span>Block Hash</span>

            <strong>
              {block.block_hash}
            </strong>
          </div>

          <div className="detail-row">
            <span>Validator</span>

            <strong>
              {block.validator}
            </strong>
          </div>

          <div className="detail-row">
            <span>Transactions</span>

            <strong>
              {block.transaction_count}
            </strong>
          </div>

          <div className="detail-row">
            <span>Gas Used</span>

            <strong>
              {Number(
                block.gas_used
              ).toLocaleString()}
            </strong>
          </div>

          <div className="detail-row">
            <span>Status</span>

            <strong
              className={
                block.status === "Confirmed"
                  ? "detail-success"
                  : "detail-error"
              }
            >
              {block.status}
            </strong>
          </div>

          <div className="detail-row">
            <span>Created At</span>

            <strong>
              {new Date(
                block.created_at
              ).toLocaleString()}
            </strong>
          </div>

        </div>

      </section>

      <div style={{ marginTop: "20px" }}>

        <Link to="/blocks">
          ← Back to Blocks
        </Link>

      </div>

    </main>
  );
}

export default BlockDetails;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function Blocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/blocks"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch blocks");
        }

        const data = await response.json();

        setBlocks(data.blocks);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load blocks from the backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  const filteredBlocks = blocks.filter((block) => {
    const search = searchText.toLowerCase();

    return (
      block.block_number
        .toString()
        .includes(search) ||
      block.block_hash
        .toLowerCase()
        .includes(search) ||
      block.validator
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <main className="page-container">

      <div className="page-heading">
        <h1>Blocks</h1>

        <p>
          Explore blockchain blocks and indexed block
          information.
        </p>
      </div>

      <div className="transaction-filter">

        <input
          type="text"
          placeholder="Search by block number, block hash, or validator..."
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
        />

        <button>
          Search
        </button>

      </div>

      <section className="all-transactions">

        <div className="section-header">
          <h2>Latest Blocks</h2>

          <span className="transaction-count">
            {filteredBlocks.length} Blocks
          </span>
        </div>

        {loading && (
          <div className="details-card">
            Loading blocks...
          </div>
        )}

        {error && (
          <div className="verification-warning">
            ⚠ {error}
            <br />
            Make sure the backend server is running.
          </div>
        )}

        {!loading && !error && (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Block</th>
                  <th>Block Hash</th>
                  <th>Validator</th>
                  <th>Transactions</th>
                  <th>Gas Used</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredBlocks.map((block) => (

                  <tr key={block.id}>

                    <td>
                      <Link
                        to={`/block/${block.block_number}`}
                        className="hash-text"
                      >
                        {block.block_number}
                      </Link>
                    </td>

                    <td>
                      {block.block_hash}
                    </td>

                    <td>
                      {block.validator}
                    </td>

                    <td>
                      {block.transaction_count}
                    </td>

                    <td>
                      {Number(
                        block.gas_used
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`status ${block.status.toLowerCase()}`}
                      >
                        {block.status}
                      </span>
                    </td>

                  </tr>

                ))}

                {filteredBlocks.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      No blocks found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </main>
  );
}

export default Blocks;
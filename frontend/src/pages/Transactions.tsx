import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function Transactions() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hash, setHash] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (hash.trim()) {
        params.append("hash", hash.trim());
      }

      if (blockNumber.trim()) {
        params.append(
          "blockNumber",
          blockNumber.trim()
        );
      }

      if (from.trim()) {
        params.append("from", from.trim());
      }

      if (to.trim()) {
        params.append("to", to.trim());
      }

      if (status !== "All") {
        params.append("status", status);
      }

      if (minAmount.trim()) {
        params.append(
          "minAmount",
          minAmount.trim()
        );
      }

      if (maxAmount.trim()) {
        params.append(
          "maxAmount",
          maxAmount.trim()
        );
      }

      const queryString = params.toString();

      const url = queryString
        ? `http://localhost:5000/api/transactions?${queryString}`
        : "http://localhost:5000/api/transactions";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Failed to fetch transactions"
        );
      }

      const data = await response.json();

      setTransactions(
        data.transactions || []
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSearch = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    fetchTransactions();
  };

  const handleReset = () => {
    setHash("");
    setBlockNumber("");
    setFrom("");
    setTo("");
    setStatus("All");
    setMinAmount("");
    setMaxAmount("");

    setTimeout(() => {
      fetch(
        "http://localhost:5000/api/transactions"
      )
        .then((response) => response.json())
        .then((data) => {
          setTransactions(
            data.transactions || []
          );
          setError("");
        })
        .catch((error) => {
          console.error(error);

          setError(
            "Unable to load transactions."
          );
        });
    }, 0);
  };

  return (
    <main className="page-container">

      <div className="page-heading">
        <h1>Transactions</h1>

        <p>
          Search and explore indexed blockchain
          transactions.
        </p>
      </div>


      {/* ================================================= */}
      {/* ADVANCED FILTERS */}
      {/* ================================================= */}

      <section className="verification-details">

        <div className="section-header">
          <h2>
            Advanced Transaction Search
          </h2>
        </div>


        <form
          onSubmit={handleSearch}
          className="details-card"
        >

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >

            {/* HASH */}

            <div>
              <label>
                Transaction Hash
              </label>

              <input
                type="text"
                placeholder="Example: 0x8A21"
                value={hash}
                onChange={(event) =>
                  setHash(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>


            {/* BLOCK NUMBER */}

            <div>
              <label>
                Block Number
              </label>

              <input
                type="number"
                placeholder="Example: 12540"
                value={blockNumber}
                onChange={(event) =>
                  setBlockNumber(
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>


            {/* FROM ADDRESS */}

            <div>
              <label>
                From Address
              </label>

              <input
                type="text"
                placeholder="Example: 0x12BC"
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>


            {/* TO ADDRESS */}

            <div>
              <label>
                To Address
              </label>

              <input
                type="text"
                placeholder="Example: 0x45DE"
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>


            {/* STATUS */}

            <div>
              <label>
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              >
                <option value="All">
                  All
                </option>

                <option value="Success">
                  Success
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Failed">
                  Failed
                </option>
              </select>
            </div>


            {/* MIN AMOUNT */}

            <div>
              <label>
                Minimum Amount
              </label>

              <input
                type="number"
                step="0.01"
                placeholder="Example: 1"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>


            {/* MAX AMOUNT */}

            <div>
              <label>
                Maximum Amount
              </label>

              <input
                type="number"
                step="0.01"
                placeholder="Example: 5"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "7px",
                  boxSizing: "border-box",
                }}
              />
            </div>

          </div>


          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "22px",
              flexWrap: "wrap",
            }}
          >

            <button
              type="submit"
              className="verify-button"
            >
              Search Transactions
            </button>


            <button
              type="button"
              className="verify-button"
              onClick={handleReset}
            >
              Reset Filters
            </button>

          </div>

        </form>

      </section>


      {/* ================================================= */}
      {/* RESULT COUNT */}
      {/* ================================================= */}

      {!loading && !error && (

        <div
          style={{
            marginTop: "20px",
            marginBottom: "15px",
          }}
        >

          <strong>
            Results Found:
            {" "}
            {transactions.length}
          </strong>

        </div>

      )}


      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loading && (

        <div className="details-card">
          Loading transactions...
        </div>

      )}


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (

        <div className="verification-warning">
          ⚠ {error}
        </div>

      )}


      {/* ================================================= */}
      {/* TRANSACTION TABLE */}
      {/* ================================================= */}

      {!loading && !error && (

        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  Transaction Hash
                </th>

                <th>
                  Block
                </th>

                <th>
                  From
                </th>

                <th>
                  To
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {transactions.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    No transactions found for
                    the selected filters.
                  </td>

                </tr>

              ) : (

                transactions.map(
                  (transaction) => (

                    <tr
                      key={transaction.id}
                    >

                      <td>

                        <Link
                          to={`/transaction/${transaction.hash}`}
                        >
                          {
                            transaction.hash
                          }
                        </Link>

                      </td>


                      <td>

                        <Link
                          to={`/block/${transaction.block_number}`}
                        >
                          {
                            transaction.block_number
                          }
                        </Link>

                      </td>


                      <td>

                        <Link
                          to={`/wallet/${transaction.from_address}`}
                        >
                          {
                            transaction.from_address
                          }
                        </Link>

                      </td>


                      <td>

                        <Link
                          to={`/wallet/${transaction.to_address}`}
                        >
                          {
                            transaction.to_address
                          }
                        </Link>

                      </td>


                      <td>

                        {Number(
                          transaction.amount
                        ).toFixed(2)}{" "}
                        ETH

                      </td>


                      <td>

                        <span
                          className={
                            transaction.status ===
                            "Success"
                              ? "detail-success"
                              : transaction.status ===
                                "Failed"
                              ? "detail-error"
                              : ""
                          }
                        >
                          {
                            transaction.status
                          }
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      )}

    </main>
  );
}

export default Transactions;
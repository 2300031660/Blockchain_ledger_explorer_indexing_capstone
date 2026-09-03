import { useEffect, useState } from "react";

type DashboardData = {
  success: boolean;
  latestBlock: number;
  blockchainTransactions: number;
  totalTransactions: number;
  totalBlocks: number;
  completeness: number;
  verificationStatus: string;
  successfulTransactions: number;
  failedTransactions: number;
};

function Dashboard() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/dashboard"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch dashboard data"
        );
      }

      const result =
        await response.json();

      setData(result);
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setError(
        "Unable to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(
      fetchDashboardData,
      5000
    );

    return () =>
      clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="page-container">
        <h1>Dashboard</h1>
        <p>Loading blockchain statistics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container">
        <h1>Dashboard</h1>

        <p>{error}</p>

        <button
          className="verify-button"
          onClick={fetchDashboardData}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Ledger Explorer Dashboard</h1>

          <p>
            Real-time blockchain indexing and
            verification statistics
          </p>
        </div>

        <button
          className="verify-button"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh Dashboard"}
        </button>
      </div>

      {data && (
        <>
          <div className="dashboard-grid">

            <div className="dashboard-card">
              <h3>Latest Block</h3>

              <p className="dashboard-number">
                {data.latestBlock}
              </p>

              <span>
                Latest Ganache block
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Blockchain Transactions
              </h3>

              <p className="dashboard-number">
                {
                  data.blockchainTransactions
                }
              </p>

              <span>
                Transactions on blockchain
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Indexed Transactions
              </h3>

              <p className="dashboard-number">
                {data.totalTransactions}
              </p>

              <span>
                PostgreSQL indexed records
              </span>
            </div>


            <div className="dashboard-card">
              <h3>Total Blocks</h3>

              <p className="dashboard-number">
                {data.totalBlocks}
              </p>

              <span>
                Blocks stored in PostgreSQL
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Index Completeness
              </h3>

              <p className="dashboard-number">
                {data.completeness}%
              </p>

              <span>
                Blockchain vs indexed data
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Verification Status
              </h3>

              <p className="dashboard-status">
                {
                  data.verificationStatus
                }
              </p>

              <span>
                Current index health
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Successful Transactions
              </h3>

              <p className="dashboard-number">
                {
                  data.successfulTransactions
                }
              </p>

              <span>
                Successful indexed transactions
              </span>
            </div>


            <div className="dashboard-card">
              <h3>
                Failed Transactions
              </h3>

              <p className="dashboard-number">
                {data.failedTransactions}
              </p>

              <span>
                Failed indexed transactions
              </span>
            </div>

          </div>


          <div className="dashboard-summary">
            <h2>System Summary</h2>

            <div className="summary-row">
              <span>
                Blockchain Network
              </span>

              <strong>
                Ganache Ethereum
              </strong>
            </div>


            <div className="summary-row">
              <span>
                Database
              </span>

              <strong>
                PostgreSQL
              </strong>
            </div>


            <div className="summary-row">
              <span>
                Latest Indexed Block
              </span>

              <strong>
                #{data.latestBlock}
              </strong>
            </div>


            <div className="summary-row">
              <span>
                Index Completeness
              </span>

              <strong>
                {data.completeness}%
              </strong>
            </div>


            <div className="summary-row">
              <span>
                System Status
              </span>

              <strong>
                {
                  data.verificationStatus
                }
              </strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
import { useState } from "react";

type FieldMismatch = {
  field: string;
  blockchainValue: string;
  indexedValue: string;
};

type MissingTransaction = {
  hash: string;
  block_number: number;
};

type ExtraTransaction = {
  hash: string;
  block_number: number;
  status: string;
};

type MismatchedTransaction = {
  hash: string;
  mismatchedFields: number;
  mismatches: FieldMismatch[];
};

type CorrectTransaction = {
  hash: string;
};

type VerificationData = {
  success: boolean;

  blockchainRecords: number;
  indexedRecords: number;

  missingRecords: number;
  extraRecords: number;
  mismatchedRecords: number;
  correctRecords: number;

  completeness: number;

  indexStatus: string;
  queryStatus: string;

  missingTransactions: MissingTransaction[];
  extraTransactions: ExtraTransaction[];
  mismatchedTransactions: MismatchedTransaction[];
  correctTransactions: CorrectTransaction[];
};

function Verification() {
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const repairCorrectness = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      "http://localhost:5000/api/blockchain/repair-correctness",
      {
        method: "POST",
      }
    );

    const result = await response.json();

    alert(result.message);

    await runVerification();
  } catch (error) {
    console.error(
      "Error repairing incorrect data:",
      error
    );

    alert(
      "Failed to repair incorrect indexed data"
    );
  } finally {
    setLoading(false);
  }
};
  const repairIndex = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      "http://localhost:5000/api/blockchain/repair-index",
      {
        method: "POST",
      }
    );

    const result = await response.json();

    alert(result.message);

    // Run verification again after repair
    await runVerification();
  } catch (error) {
    console.error(
      "Error repairing index:",
      error
    );

    alert("Failed to repair index");
  } finally {
    setLoading(false);
  }
};
  const runVerification = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/verification"
      );

      if (!response.ok) {
        throw new Error("Verification request failed");
      }

      const data: VerificationData =
        await response.json();

      setVerificationData(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the verification server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-container">

      <div className="page-heading">
        <h1>Index Verification</h1>

        <p>
          Verify indexing completeness and query
          correctness against blockchain data.
        </p>
      </div>


      <div className="verification-page-grid">

        <div className="verification-card">
          <h3>Blockchain Records</h3>

          <p className="verification-number">
            {verificationData
              ? verificationData.blockchainRecords
              : "Not Checked"}
          </p>
        </div>


        <div className="verification-card">
          <h3>Indexed Records</h3>

          <p className="verification-number">
            {verificationData
              ? verificationData.indexedRecords
              : "Not Checked"}
          </p>
        </div>


        <div className="verification-card">
          <h3>Missing Records</h3>

          {!verificationData ? (
            <p className="verification-waiting">
              Not Checked
            </p>
          ) : (
            <p
              className={
                verificationData.missingRecords === 0
                  ? "verification-success"
                  : "verification-error"
              }
            >
              {verificationData.missingRecords}
            </p>
          )}
        </div>


        <div className="verification-card">
          <h3>Extra Records</h3>

          {!verificationData ? (
            <p className="verification-waiting">
              Not Checked
            </p>
          ) : (
            <p
              className={
                verificationData.extraRecords === 0
                  ? "verification-success"
                  : "verification-error"
              }
            >
              {verificationData.extraRecords}
            </p>
          )}
        </div>


        <div className="verification-card">
          <h3>Index Completeness</h3>

          {!verificationData ? (
            <p className="verification-waiting">
              Not Checked
            </p>
          ) : (
            <p
              className={
                verificationData.indexStatus ===
                "Complete"
                  ? "verification-success"
                  : "verification-error"
              }
            >
              {verificationData.completeness}%
            </p>
          )}
        </div>

      </div>


      <section className="verification-details">

        <div className="section-header">
          <h2>Verification Status</h2>
        </div>


        <div className="details-card">

          <div className="detail-row">
            <span>Index Status</span>

            {!verificationData ? (
              <strong className="verification-waiting">
                Not Verified Yet
              </strong>
            ) : (
              <strong
                className={
                  verificationData.indexStatus ===
                  "Complete"
                    ? "detail-success"
                    : "detail-error"
                }
              >
                {verificationData.indexStatus}
              </strong>
            )}
          </div>


          <div className="detail-row">
            <span>Query Status</span>

            {!verificationData ? (
              <strong className="verification-waiting">
                Not Verified Yet
              </strong>
            ) : (
              <strong
                className={
                  verificationData.queryStatus ===
                  "Correct"
                    ? "detail-success"
                    : "detail-error"
                }
              >
                {verificationData.queryStatus}
              </strong>
            )}
          </div>


          <div className="detail-row">
            <span>Correct Transactions</span>

            <strong>
              {verificationData
                ? verificationData.correctRecords
                : "Not Checked"}
            </strong>
          </div>


          <div className="detail-row">
            <span>Mismatched Transactions</span>

            {!verificationData ? (
              <strong className="verification-waiting">
                Not Checked
              </strong>
            ) : (
              <strong
                className={
                  verificationData.mismatchedRecords === 0
                    ? "detail-success"
                    : "detail-error"
                }
              >
                {verificationData.mismatchedRecords}
              </strong>
            )}
          </div>


          <div className="detail-row">
            <span>Missing Transactions</span>

            {!verificationData ? (
              <strong className="verification-waiting">
                Not Checked
              </strong>
            ) : (
              <strong
                className={
                  verificationData.missingRecords === 0
                    ? "detail-success"
                    : "detail-error"
                }
              >
                {verificationData.missingRecords}
              </strong>
            )}
          </div>


          <div className="detail-row">
            <span>Extra Transactions</span>

            {!verificationData ? (
              <strong className="verification-waiting">
                Not Checked
              </strong>
            ) : (
              <strong
                className={
                  verificationData.extraRecords === 0
                    ? "detail-success"
                    : "detail-error"
                }
              >
                {verificationData.extraRecords}
              </strong>
            )}
          </div>

        </div>


        <div className="verify-button-container">

          <div className="verification-buttons">
  <button
    className="verify-button"
    onClick={runVerification}
    disabled={loading}
  >
    {loading
      ? "Processing..."
      : "Run Verification"}
  </button>

  <button
    className="repair-button"
    onClick={repairIndex}
    disabled={loading}
  >
    Repair Missing Index
  </button>

  <button
    className="correctness-button"
    onClick={repairCorrectness}
    disabled={loading}
  >
    Repair Incorrect Data
  </button>
</div>
        </div>

      </section>


      {error && (
        <div className="verification-warning">
          ⚠ {error}
          <br />
          Make sure the backend server is running
          on port 5000.
        </div>
      )}


      {verificationData && (
        <>

          {verificationData.missingTransactions.length >
            0 && (

            <section className="verification-details">

              <div className="section-header">
                <h2>Missing Transactions</h2>
              </div>


              <div className="verification-warning">

                <strong>
                  ⚠ Incomplete Index Detected
                </strong>

                <br />
                <br />

                {verificationData.missingRecords} blockchain
                transaction(s) are missing from PostgreSQL.

              </div>


              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>Transaction Hash</th>
                      <th>Block Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>


                  <tbody>

                    {verificationData.missingTransactions.map(
                      (transaction, index) => (

                        <tr key={index}>

                          <td>
                            {transaction.hash}
                          </td>

                          <td>
                            {transaction.block_number}
                          </td>

                          <td>
                            <span className="mismatch-status">
                              Missing
                            </span>
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          )}


          {verificationData.extraTransactions.length >
            0 && (

            <section className="verification-details">

              <div className="section-header">
                <h2>Extra / Invalid Transactions</h2>
              </div>


              <div className="verification-warning">

                <strong>
                  ⚠ Extra Indexed Records Detected
                </strong>

                <br />
                <br />

                {verificationData.extraRecords} transaction(s)
                exist in PostgreSQL but are not present in
                the blockchain source.

              </div>


              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>Transaction Hash</th>
                      <th>Block Number</th>
                      <th>Indexed Status</th>
                      <th>Verification</th>
                    </tr>
                  </thead>


                  <tbody>

                    {verificationData.extraTransactions.map(
                      (transaction, index) => (

                        <tr key={index}>

                          <td>
                            {transaction.hash}
                          </td>

                          <td>
                            {transaction.block_number}
                          </td>

                          <td>
                            {transaction.status}
                          </td>

                          <td>
                            <span className="mismatch-status">
                              Extra / Invalid
                            </span>
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          )}


          {verificationData.mismatchedTransactions
            .length > 0 && (

            <section className="verification-details">

              <div className="section-header">
                <h2>
                  Query Correctness Mismatches
                </h2>
              </div>


              <div className="query-mismatch-section">

                <div className="mismatch-heading">
                  ❌ Query Mismatch Detected
                </div>


                <p className="mismatch-description">
                  Indexed transaction values do not
                  completely match the blockchain
                  source of truth.
                </p>


                {verificationData.mismatchedTransactions.map(
                  (transaction, txIndex) => (

                    <div
                      key={txIndex}
                      style={{
                        marginTop: "25px",
                      }}
                    >

                      <h3>
                        Transaction:{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                          }}
                        >
                          {transaction.hash}
                        </span>
                      </h3>


                      <p>
                        Mismatched Fields:{" "}
                        <strong>
                          {transaction.mismatchedFields}
                        </strong>
                      </p>


                      <div className="table-container">

                        <table>

                          <thead>
                            <tr>
                              <th>Field</th>
                              <th>Blockchain Value</th>
                              <th>Indexed Value</th>
                              <th>Status</th>
                            </tr>
                          </thead>


                          <tbody>

                            {transaction.mismatches.map(
                              (
                                mismatch,
                                mismatchIndex
                              ) => (

                                <tr key={mismatchIndex}>

                                  <td>
                                    {mismatch.field}
                                  </td>

                                  <td>
                                    {mismatch.blockchainValue}
                                  </td>

                                  <td>
                                    {mismatch.indexedValue}
                                  </td>

                                  <td>
                                    <span className="mismatch-status">
                                      Mismatch
                                    </span>
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {verificationData.correctTransactions.length >
            0 && (

            <section className="verification-details">

              <div className="section-header">
                <h2>Correct Transactions</h2>
              </div>


              <div className="details-card">

                {verificationData.correctTransactions.map(
                  (transaction, index) => (

                    <div
                      className="detail-row"
                      key={index}
                    >

                      <span
                        style={{
                          fontFamily: "monospace",
                        }}
                      >
                        {transaction.hash}
                      </span>

                      <strong className="detail-success">
                        Correct
                      </strong>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {verificationData.indexStatus === "Complete" &&
            verificationData.queryStatus === "Correct" && (

              <div className="verification-result">

                ✓ Verification completed successfully.

                <br />

                Blockchain and PostgreSQL indexed
                records are fully synchronized and
                query results are correct.

              </div>

            )}

        </>
      )}

    </main>
  );
}

export default Verification;
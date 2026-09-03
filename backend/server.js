const { ethers } = require("ethers");
const pool = require("./db");
const {
  provider,
  testBlockchainConnection,
} = require("./blockchain");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;


// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("Ledger Explorer Backend is Running");
});


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend API connected successfully",
  });
});


// =====================================================
// DATABASE TEST ROUTE
// =====================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM transactions"
    );

    res.json({
      success: true,
      message: "PostgreSQL connected successfully",
      transactionCount: result.rows[0].count,
    });
  } catch (error) {
    console.error(
      "Database connection error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


// =====================================================
// VERIFICATION API
// =====================================================

// =====================================================
// VERIFICATION API
// =====================================================
// =====================================================
// REAL BLOCKCHAIN VERIFICATION API
// =====================================================

app.get("/api/verification", async (req, res) => {
  try {
    // =================================================
    // 1. READ ALL REAL GANACHE TRANSACTIONS
    // =================================================

    const latestBlockNumber =
      await provider.getBlockNumber();

    const blockchainTransactions = [];

    for (
      let blockNumber = 0;
      blockNumber <= latestBlockNumber;
      blockNumber++
    ) {
      const block =
        await provider.getBlock(
          blockNumber,
          true
        );

      if (!block) {
        continue;
      }

      for (
        const transactionItem of
        block.transactions
      ) {
        let transaction;

        if (
          typeof transactionItem === "string"
        ) {
          transaction =
            await provider.getTransaction(
              transactionItem
            );
        } else {
          transaction =
            transactionItem;
        }

        if (!transaction) {
          continue;
        }

        const receipt =
          await provider.getTransactionReceipt(
            transaction.hash
          );

        blockchainTransactions.push({
          hash: transaction.hash,

          block_number:
            transaction.blockNumber,

          from_address:
            transaction.from,

          to_address:
            transaction.to ||
            "Contract Creation",

          amount:
            Number(
              ethers.formatEther(
                transaction.value
              )
            ),

          status:
            receipt?.status === 1
              ? "Success"
              : "Failed",
        });
      }
    }


    // =================================================
    // 2. GET ALL INDEXED TRANSACTIONS FROM POSTGRESQL
    // =================================================

    const indexedResult =
      await pool.query(`
        SELECT
          hash,
          block_number,
          from_address,
          to_address,
          amount,
          status
        FROM transactions
        ORDER BY id ASC
      `);

    const indexedTransactions =
      indexedResult.rows;


    // =================================================
    // 3. RESULT ARRAYS
    // =================================================

    const missingTransactions = [];
    const extraTransactions = [];
    const mismatchedTransactions = [];
    const correctTransactions = [];


    // =================================================
    // 4. COMPARE BLOCKCHAIN → POSTGRESQL
    // =================================================

    for (
      const blockchainTx of
      blockchainTransactions
    ) {
      const indexedTx =
        indexedTransactions.find(
          (tx) =>
            tx.hash === blockchainTx.hash
        );

      // -----------------------------------------------
      // MISSING FROM POSTGRESQL
      // -----------------------------------------------

      if (!indexedTx) {
        missingTransactions.push({
          hash:
            blockchainTx.hash,

          block_number:
            blockchainTx.block_number,
        });

        continue;
      }


      // -----------------------------------------------
      // FIELD MISMATCH CHECK
      // -----------------------------------------------

      const fieldMismatches = [];


      // Block Number

      if (
        Number(indexedTx.block_number) !==
        Number(blockchainTx.block_number)
      ) {
        fieldMismatches.push({
          field: "Block Number",

          blockchainValue:
            String(
              blockchainTx.block_number
            ),

          indexedValue:
            String(
              indexedTx.block_number
            ),
        });
      }


      // From Address

      if (
        indexedTx.from_address
          .toLowerCase() !==
        blockchainTx.from_address
          .toLowerCase()
      ) {
        fieldMismatches.push({
          field: "From Address",

          blockchainValue:
            blockchainTx.from_address,

          indexedValue:
            indexedTx.from_address,
        });
      }


      // To Address

      if (
        indexedTx.to_address
          .toLowerCase() !==
        blockchainTx.to_address
          .toLowerCase()
      ) {
        fieldMismatches.push({
          field: "To Address",

          blockchainValue:
            blockchainTx.to_address,

          indexedValue:
            indexedTx.to_address,
        });
      }


      // Amount

      if (
        Number(indexedTx.amount) !==
        Number(blockchainTx.amount)
      ) {
        fieldMismatches.push({
          field: "Amount",

          blockchainValue:
            `${Number(
              blockchainTx.amount
            ).toFixed(4)} ETH`,

          indexedValue:
            `${Number(
              indexedTx.amount
            ).toFixed(4)} ETH`,
        });
      }


      // Status

      if (
        indexedTx.status !==
        blockchainTx.status
      ) {
        fieldMismatches.push({
          field: "Status",

          blockchainValue:
            blockchainTx.status,

          indexedValue:
            indexedTx.status,
        });
      }


      // -----------------------------------------------
      // SAVE COMPARISON RESULT
      // -----------------------------------------------

      if (
        fieldMismatches.length > 0
      ) {
        mismatchedTransactions.push({
          hash:
            blockchainTx.hash,

          mismatchedFields:
            fieldMismatches.length,

          mismatches:
            fieldMismatches,
        });
      } else {
        correctTransactions.push({
          hash:
            blockchainTx.hash,
        });
      }
    }


    // =================================================
    // 5. FIND EXTRA POSTGRESQL TRANSACTIONS
    // =================================================

    for (
      const indexedTx of
      indexedTransactions
    ) {
      const existsOnBlockchain =
        blockchainTransactions.some(
          (blockchainTx) =>
            blockchainTx.hash ===
            indexedTx.hash
        );

      if (!existsOnBlockchain) {
        extraTransactions.push({
          hash:
            indexedTx.hash,

          block_number:
            indexedTx.block_number,

          status:
            indexedTx.status,
        });
      }
    }


    // =================================================
    // 6. COUNTS
    // =================================================

    const blockchainRecords =
      blockchainTransactions.length;

    const indexedRecords =
      indexedTransactions.length;

    const missingRecords =
      missingTransactions.length;

    const extraRecords =
      extraTransactions.length;

    const mismatchedRecords =
      mismatchedTransactions.length;

    const correctRecords =
      correctTransactions.length;


    // =================================================
    // 7. COMPLETENESS CALCULATION
    // =================================================

    const matchedBlockchainRecords =
      blockchainRecords -
      missingRecords;

    const completeness =
      blockchainRecords === 0
        ? 100
        : Number(
            (
              (
                matchedBlockchainRecords /
                blockchainRecords
              ) *
              100
            ).toFixed(2)
          );


    // =================================================
    // 8. INDEX STATUS
    // =================================================

    const indexStatus =
      missingRecords === 0 &&
      extraRecords === 0
        ? "Complete"
        : "Incomplete";


    // =================================================
    // 9. QUERY STATUS
    // =================================================

    const queryStatus =
      mismatchedRecords === 0
        ? "Correct"
        : "Mismatch Detected";


    // =================================================
    // 10. RESPONSE
    // =================================================

    res.json({
      success: true,

      latestBlockchainBlock:
        latestBlockNumber,

      blockchainRecords,
      indexedRecords,

      missingRecords,
      extraRecords,
      mismatchedRecords,
      correctRecords,

      completeness,
      indexStatus,
      queryStatus,

      missingTransactions,
      extraTransactions,
      mismatchedTransactions,
      correctTransactions,
    });

  } catch (error) {
    console.error(
      "Real blockchain verification error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to verify PostgreSQL index against Ganache blockchain",

      error:
        error.message,
    });
  }
});

// =====================================================
// GET ALL TRANSACTIONS
// =====================================================

// =====================================================
// GET ALL TRANSACTIONS + ADVANCED FILTERING
// =====================================================

app.get("/api/transactions", async (req, res) => {
  try {
    const {
      hash,
      blockNumber,
      from,
      to,
      status,
      minAmount,
      maxAmount,
    } = req.query;

    let query = `
      SELECT
        id,
        hash,
        block_number,
        from_address,
        to_address,
        amount,
        status,
        created_at
      FROM transactions
      WHERE 1 = 1
    `;

    const values = [];
    let parameterNumber = 1;


    // =================================================
    // FILTER BY TRANSACTION HASH
    // =================================================

    if (hash) {
  query += `
    AND hash ILIKE $${parameterNumber}
  `;

  values.push(`%${hash}%`);
  parameterNumber++;
}


    // =================================================
    // FILTER BY BLOCK NUMBER
    // =================================================

    if (blockNumber) {
      query += `
        AND block_number = $${parameterNumber}
      `;

      values.push(Number(blockNumber));
      parameterNumber++;
    }


    // =================================================
    // FILTER BY FROM ADDRESS
    // =================================================

    if (from) {
  query += `
    AND from_address ILIKE $${parameterNumber}
  `;

  values.push(`%${from}%`);
  parameterNumber++;
}


    // =================================================
    // FILTER BY TO ADDRESS
    // =================================================

    if (to) {
  query += `
    AND to_address ILIKE $${parameterNumber}
  `;

  values.push(`%${to}%`);
  parameterNumber++;
}


    // =================================================
    // FILTER BY STATUS
    // =================================================

    if (status && status !== "All") {
      query += `
        AND LOWER(status)
        = LOWER($${parameterNumber})
      `;

      values.push(status);
      parameterNumber++;
    }


    // =================================================
    // FILTER BY MINIMUM AMOUNT
    // =================================================

    if (minAmount) {
      query += `
        AND amount >= $${parameterNumber}
      `;

      values.push(Number(minAmount));
      parameterNumber++;
    }


    // =================================================
    // FILTER BY MAXIMUM AMOUNT
    // =================================================

    if (maxAmount) {
      query += `
        AND amount <= $${parameterNumber}
      `;

      values.push(Number(maxAmount));
      parameterNumber++;
    }


    // =================================================
    // SORT RESULTS
    // =================================================

    query += `
      ORDER BY block_number DESC
    `;


    // =================================================
    // RUN QUERY
    // =================================================

    const result = await pool.query(
      query,
      values
    );


    // =================================================
    // SEND RESPONSE
    // =================================================

    res.json({
      success: true,

      count: result.rows.length,

      filters: {
        hash: hash || "",
        blockNumber: blockNumber || "",
        from: from || "",
        to: to || "",
        status: status || "All",
        minAmount: minAmount || "",
        maxAmount: maxAmount || "",
      },

      transactions: result.rows,
    });

  } catch (error) {

    console.error(
      "Error fetching transactions:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch transactions",
    });

  }
});


// =====================================================
// GET SINGLE TRANSACTION
// =====================================================

app.get(
  "/api/transactions/:hash",
  async (req, res) => {
    try {
      const { hash } = req.params;

      const result = await pool.query(
        `
        SELECT
          id,
          hash,
          block_number,
          from_address,
          to_address,
          amount,
          status,
          created_at
        FROM transactions
        WHERE hash = $1
        `,
        [hash]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Transaction not found",
        });
      }

      res.json({
        success: true,
        transaction:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error fetching transaction:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch transaction",
      });
    }
  }
);


// =====================================================
// GET ALL BLOCKS
// =====================================================

app.get("/api/blocks", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        block_number,
        block_hash,
        validator,
        transaction_count,
        gas_used,
        status,
        created_at
      FROM blocks
      ORDER BY block_number DESC
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      blocks: result.rows,
    });
  } catch (error) {
    console.error(
      "Error fetching blocks:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch blocks",
    });
  }
});


// =====================================================
// GET SINGLE BLOCK
// =====================================================

app.get(
  "/api/blocks/:number",
  async (req, res) => {
    try {
      const blockNumber =
        Number(req.params.number);

      const result = await pool.query(
        `
        SELECT
          id,
          block_number,
          block_hash,
          validator,
          transaction_count,
          gas_used,
          status,
          created_at
        FROM blocks
        WHERE block_number = $1
        `,
        [blockNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Block not found",
        });
      }

      res.json({
        success: true,
        block:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error fetching block:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch block",
      });
    }
  }
);


// =====================================================
// GET ALL WALLETS
// =====================================================

app.get("/api/wallets", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        address,
        balance,
        transaction_count,
        wallet_type,
        status,
        created_at
      FROM wallets
      ORDER BY id ASC
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      wallets: result.rows,
    });
  } catch (error) {
    console.error(
      "Error fetching wallets:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch wallets",
    });
  }
});


// =====================================================
// GET SINGLE WALLET
// =====================================================

app.get(
  "/api/wallets/:address",
  async (req, res) => {
    try {
      const { address } =
        req.params;

      const result = await pool.query(
        `
        SELECT
          id,
          address,
          balance,
          transaction_count,
          wallet_type,
          status,
          created_at
        FROM wallets
        WHERE address = $1
        `,
        [address]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found",
        });
      }

      res.json({
        success: true,
        wallet:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Error fetching wallet:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch wallet",
      });
    }
  }
);


// =====================================================
// START SERVER
// =====================================================
// =====================================================
// BLOCKCHAIN CONNECTION TEST
// =====================================================

app.get(
  "/api/blockchain-test",
  async (req, res) => {
    try {
      const blockNumber =
        await provider.getBlockNumber();

      const network =
        await provider.getNetwork();

      res.json({
        success: true,
        message:
          "Connected to Ganache successfully",
        latestBlock: blockNumber,
        chainId:
          network.chainId.toString(),
      });
    } catch (error) {
      console.error(
        "Blockchain test error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to connect to Ganache",
      });
    }
  }
);
// =====================================================
// CREATE REAL GANACHE TRANSACTION
// =====================================================

app.post(
  "/api/blockchain/create-transaction",
  async (req, res) => {
    try {
      // Get Ganache account 0 and account 1
      const sender =
        await provider.getSigner(0);

      const receiver =
        await provider.getSigner(1);

      const senderAddress =
        await sender.getAddress();

      const receiverAddress =
        await receiver.getAddress();


      // Send 1 ETH from account 0 to account 1
      const transaction =
        await sender.sendTransaction({
          to: receiverAddress,
          value:
            require("ethers").ethers.parseEther(
  "1.0"
),
        });


      // Wait until transaction is mined
      const receipt =
        await transaction.wait();


      res.json({
        success: true,

        message:
          "Real Ethereum transaction created successfully",

        transactionHash:
          transaction.hash,

        from:
          senderAddress,

        to:
          receiverAddress,

        amount:
          "1.00 ETH",

        blockNumber:
          receipt.blockNumber,

        status:
          receipt.status === 1
            ? "Success"
            : "Failed",
      });

    } catch (error) {

      console.error(
        "Transaction creation error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to create blockchain transaction",

        error:
          error.message,
      });

    }
  }
);
// =====================================================
// GET REAL BLOCKS FROM GANACHE
// =====================================================

app.get("/api/blockchain/blocks", async (req, res) => {
  try {
    const latestBlockNumber =
      await provider.getBlockNumber();

    const blocks = [];

    for (
      let blockNumber = 0;
      blockNumber <= latestBlockNumber;
      blockNumber++
    ) {
      const block =
        await provider.getBlock(
          blockNumber,
          true
        );

      if (!block) {
        continue;
      }

      blocks.push({
        blockNumber: block.number,
        blockHash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        transactionCount:
          block.transactions.length,
      });
    }

    res.json({
      success: true,
      latestBlockNumber,
      count: blocks.length,
      blocks,
    });
  } catch (error) {
    console.error(
      "Error fetching blockchain blocks:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch blockchain blocks",
    });
  }
});


// =====================================================
// GET REAL TRANSACTIONS FROM GANACHE
// =====================================================

app.get(
  "/api/blockchain/transactions",
  async (req, res) => {
    try {
      const latestBlockNumber =
        await provider.getBlockNumber();

      const transactions = [];

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }

        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;

          // Depending on provider response,
          // transactionItem can be a hash
          // or a full transaction object.
          if (
            typeof transactionItem ===
            "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }

          if (!transaction) {
            continue;
          }

          const receipt =
            await provider.getTransactionReceipt(
              transaction.hash
            );

          transactions.push({
            hash:
              transaction.hash,

            blockNumber:
              transaction.blockNumber,

            from:
              transaction.from,

            to:
              transaction.to,

            amount:
              ethers.formatEther(
                transaction.value
              ),

            status:
              receipt?.status === 1
                ? "Success"
                : "Failed",
          });
        }
      }

      res.json({
        success: true,
        count:
          transactions.length,
        transactions,
      });
    } catch (error) {
      console.error(
        "Error fetching blockchain transactions:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch blockchain transactions",
      });
    }
  }
);
// =====================================================
// SYNC GANACHE TRANSACTIONS TO POSTGRESQL
// =====================================================

app.post(
  "/api/blockchain/sync-transactions",
  async (req, res) => {
    try {
      const latestBlockNumber =
        await provider.getBlockNumber();

      let scannedTransactions = 0;
      let insertedTransactions = 0;
      let existingTransactions = 0;

      const syncedTransactions = [];

      // =================================================
      // READ EVERY BLOCK
      // =================================================

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }

        // =================================================
        // READ EVERY TRANSACTION IN BLOCK
        // =================================================

        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;

          if (
            typeof transactionItem ===
            "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }

          if (!transaction) {
            continue;
          }

          scannedTransactions++;

          const receipt =
            await provider.getTransactionReceipt(
              transaction.hash
            );

          const transactionStatus =
            receipt?.status === 1
              ? "Success"
              : "Failed";

          const amount =
            ethers.formatEther(
              transaction.value
            );

          // =================================================
          // CHECK IF TRANSACTION ALREADY EXISTS
          // =================================================

          const existingResult =
            await pool.query(
              `
              SELECT id
              FROM transactions
              WHERE hash = $1
              `,
              [transaction.hash]
            );

          if (
            existingResult.rows.length > 0
          ) {
            existingTransactions++;

            continue;
          }

          // =================================================
          // INSERT NEW BLOCKCHAIN TRANSACTION
          // =================================================

          const insertResult =
            await pool.query(
              `
              INSERT INTO transactions
              (
                hash,
                block_number,
                from_address,
                to_address,
                amount,
                status
              )
              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
              )
              RETURNING *
              `,
              [
                transaction.hash,

                transaction.blockNumber,

                transaction.from,

                transaction.to ||
                  "Contract Creation",

                Number(amount),

                transactionStatus,
              ]
            );

          insertedTransactions++;

          syncedTransactions.push(
            insertResult.rows[0]
          );
        }
      }

      // =================================================
      // SEND SYNC RESULT
      // =================================================

      res.json({
        success: true,

        message:
          "Blockchain transactions synchronized successfully",

        latestBlock:
          latestBlockNumber,

        scannedTransactions,

        insertedTransactions,

        existingTransactions,

        syncedTransactions,
      });
    } catch (error) {
      console.error(
        "Blockchain synchronization error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to synchronize blockchain transactions",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// REPAIR / RE-INDEX MISSING BLOCKCHAIN TRANSACTIONS
// =====================================================

app.post(
  "/api/blockchain/repair-index",
  async (req, res) => {
    try {
      const latestBlockNumber =
        await provider.getBlockNumber();

      let scannedTransactions = 0;
      let repairedTransactions = 0;

      const repairedRecords = [];


      // =================================================
      // READ ALL BLOCKS FROM GANACHE
      // =================================================

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }


        // =================================================
        // READ EVERY TRANSACTION
        // =================================================

        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;


          if (
            typeof transactionItem === "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }


          if (!transaction) {
            continue;
          }


          scannedTransactions++;


          // =================================================
          // CHECK IF TRANSACTION EXISTS IN POSTGRESQL
          // =================================================

          const existingResult =
            await pool.query(
              `
              SELECT id
              FROM transactions
              WHERE hash = $1
              `,
              [transaction.hash]
            );


          // Already indexed
          if (
            existingResult.rows.length > 0
          ) {
            continue;
          }


          // =================================================
          // TRANSACTION IS MISSING → REPAIR IT
          // =================================================

          const receipt =
            await provider.getTransactionReceipt(
              transaction.hash
            );


          const amount =
            ethers.formatEther(
              transaction.value
            );


          const transactionStatus =
            receipt?.status === 1
              ? "Success"
              : "Failed";


          const insertResult =
            await pool.query(
              `
              INSERT INTO transactions
              (
                hash,
                block_number,
                from_address,
                to_address,
                amount,
                status
              )
              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
              )
              RETURNING *
              `,
              [
                transaction.hash,

                transaction.blockNumber,

                transaction.from,

                transaction.to ||
                  "Contract Creation",

                Number(amount),

                transactionStatus,
              ]
            );


          repairedTransactions++;


          repairedRecords.push(
            insertResult.rows[0]
          );
        }
      }


      // =================================================
      // SEND RESULT
      // =================================================

      res.json({
        success: true,

        message:
          repairedTransactions > 0
            ? "Missing blockchain transactions repaired successfully"
            : "Index is already synchronized",

        latestBlock:
          latestBlockNumber,

        scannedTransactions,

        repairedTransactions,

        repairedRecords,
      });

    } catch (error) {

      console.error(
        "Index repair error:",
        error
      );


      res.status(500).json({
        success: false,

        message:
          "Failed to repair blockchain index",

        error:
          error.message,
      });

    }
  }
);
// =====================================================
// REPAIR INCORRECT INDEXED TRANSACTIONS
// =====================================================

app.post(
  "/api/blockchain/repair-correctness",
  async (req, res) => {
    try {
      const latestBlockNumber =
        await provider.getBlockNumber();

      let scannedTransactions = 0;
      let repairedTransactions = 0;

      const repairedRecords = [];

      // =================================================
      // READ ALL REAL BLOCKCHAIN TRANSACTIONS
      // =================================================

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }

        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;

          if (
            typeof transactionItem === "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }

          if (!transaction) {
            continue;
          }

          scannedTransactions++;

          const receipt =
            await provider.getTransactionReceipt(
              transaction.hash
            );

          const blockchainData = {
            hash: transaction.hash,

            block_number:
              transaction.blockNumber,

            from_address:
              transaction.from,

            to_address:
              transaction.to ||
              "Contract Creation",

            amount:
              Number(
                ethers.formatEther(
                  transaction.value
                )
              ),

            status:
              receipt?.status === 1
                ? "Success"
                : "Failed",
          };

          // =================================================
          // FIND MATCHING INDEXED RECORD
          // =================================================

          const indexedResult =
            await pool.query(
              `
              SELECT *
              FROM transactions
              WHERE hash = $1
              `,
              [blockchainData.hash]
            );

          // Missing records are handled
          // by repair-index, not this route.
          if (
            indexedResult.rows.length === 0
          ) {
            continue;
          }

          const indexedData =
            indexedResult.rows[0];

          // =================================================
          // CHECK WHETHER ANY FIELD IS WRONG
          // =================================================

          const blockMismatch =
            Number(
              indexedData.block_number
            ) !==
            Number(
              blockchainData.block_number
            );

          const fromMismatch =
            indexedData.from_address
              .toLowerCase() !==
            blockchainData.from_address
              .toLowerCase();

          const toMismatch =
            indexedData.to_address
              .toLowerCase() !==
            blockchainData.to_address
              .toLowerCase();

          const amountMismatch =
            Number(indexedData.amount) !==
            Number(blockchainData.amount);

          const statusMismatch =
            indexedData.status !==
            blockchainData.status;

          const hasMismatch =
            blockMismatch ||
            fromMismatch ||
            toMismatch ||
            amountMismatch ||
            statusMismatch;

          if (!hasMismatch) {
            continue;
          }

          // =================================================
          // UPDATE POSTGRESQL USING BLOCKCHAIN VALUES
          // =================================================

          const updateResult =
            await pool.query(
              `
              UPDATE transactions
              SET
                block_number = $1,
                from_address = $2,
                to_address = $3,
                amount = $4,
                status = $5
              WHERE hash = $6
              RETURNING *
              `,
              [
                blockchainData.block_number,
                blockchainData.from_address,
                blockchainData.to_address,
                blockchainData.amount,
                blockchainData.status,
                blockchainData.hash,
              ]
            );

          repairedTransactions++;

          repairedRecords.push(
            updateResult.rows[0]
          );
        }
      }

      res.json({
        success: true,

        message:
          repairedTransactions > 0
            ? "Incorrect indexed data repaired successfully"
            : "All indexed transaction data is already correct",

        scannedTransactions,

        repairedTransactions,

        repairedRecords,
      });

    } catch (error) {
      console.error(
        "Query correctness repair error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to repair indexed transaction data",

        error:
          error.message,
      });
    }
  }
);
// =====================================================
// AUTOMATIC BLOCKCHAIN INDEXER
// =====================================================

let lastIndexedBlock = 0;

async function indexNewBlocks() {
  try {
    const latestBlockNumber =
      await provider.getBlockNumber();

    if (latestBlockNumber <= lastIndexedBlock) {
      return;
    }

    console.log(
      `New blockchain block detected: ${latestBlockNumber}`
    );

    for (
      let blockNumber = lastIndexedBlock + 1;
      blockNumber <= latestBlockNumber;
      blockNumber++
    ) {
      const block =
        await provider.getBlock(
          blockNumber,
          true
        );

      if (!block) {
        continue;
      }
// =====================================================
// INDEX BLOCK INTO POSTGRESQL
// =====================================================

await pool.query(
  `
  INSERT INTO blocks
  (
    block_number,
    block_hash,
    validator,
    transaction_count,
    gas_used,
    status
  )
  VALUES
  (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6
  )
  ON CONFLICT (block_number)
  DO UPDATE SET
    block_hash = EXCLUDED.block_hash,
    validator = EXCLUDED.validator,
    transaction_count =
      EXCLUDED.transaction_count,
    gas_used = EXCLUDED.gas_used,
    status = EXCLUDED.status
  `,
  [
    block.number,
    block.hash,

    // Ganache/Ethereum block miner address
    block.miner ||
      block.author ||
      "Unknown",

    block.transactions.length,

    block.gasUsed
      ? block.gasUsed.toString()
      : "0",

    "Confirmed",
  ]
);

console.log(
  `Indexed block: ${block.number}`
);
      for (
        const transactionItem of
        block.transactions
      ) {
        let transaction;

        if (
          typeof transactionItem === "string"
        ) {
          transaction =
            await provider.getTransaction(
              transactionItem
            );
        } else {
          transaction =
            transactionItem;
        }

        if (!transaction) {
          continue;
        }

        const receipt =
          await provider.getTransactionReceipt(
            transaction.hash
          );

        const amount =
          ethers.formatEther(
            transaction.value
          );

        const transactionStatus =
          receipt?.status === 1
            ? "Success"
            : "Failed";

        await pool.query(
          `
          INSERT INTO transactions
          (
            hash,
            block_number,
            from_address,
            to_address,
            amount,
            status
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT (hash)
          DO NOTHING
          `,
          [
            transaction.hash,
            transaction.blockNumber,
            transaction.from,
            transaction.to ||
              "Contract Creation",
            Number(amount),
            transactionStatus,
          ]
        );

        console.log(
          `Indexed transaction: ${transaction.hash}`
        );
      }
    }

    lastIndexedBlock =
      latestBlockNumber;

  } catch (error) {
    console.error(
      "Automatic indexing error:",
      error.message
    );
  }
}
// =====================================================
// BACKFILL / SYNC ALL GANACHE BLOCKS TO POSTGRESQL
// =====================================================

app.post(
  "/api/blockchain/sync-blocks",
  async (req, res) => {
    try {
      const latestBlockNumber =
        await provider.getBlockNumber();

      let scannedBlocks = 0;
      let syncedBlocks = 0;

      const syncedBlockNumbers = [];

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }

        scannedBlocks++;

        await pool.query(
          `
          INSERT INTO blocks
          (
            block_number,
            block_hash,
            validator,
            transaction_count,
            gas_used,
            status
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT (block_number)
          DO UPDATE SET
            block_hash = EXCLUDED.block_hash,
            validator = EXCLUDED.validator,
            transaction_count =
              EXCLUDED.transaction_count,
            gas_used = EXCLUDED.gas_used,
            status = EXCLUDED.status
          `,
          [
            block.number,

            block.hash,

            block.miner ||
              block.author ||
              "Unknown",

            block.transactions.length,

            block.gasUsed
              ? block.gasUsed.toString()
              : "0",

            "Confirmed",
          ]
        );

        syncedBlocks++;

        syncedBlockNumbers.push(
          block.number
        );
      }

      res.json({
        success: true,

        message:
          "All Ganache blocks synchronized successfully",

        latestBlock:
          latestBlockNumber,

        scannedBlocks,

        syncedBlocks,

        syncedBlockNumbers,
      });

    } catch (error) {
      console.error(
        "Block synchronization error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to synchronize blockchain blocks",

        error:
          error.message,
      });
    }
  }
);
// =====================================================
// DASHBOARD REAL-TIME STATISTICS
// =====================================================

app.get("/api/dashboard", async (req, res) => {
  try {
    // ===============================================
    // 1. LATEST BLOCK FROM GANACHE
    // ===============================================

    const latestBlock =
      await provider.getBlockNumber();


    // ===============================================
    // 2. TOTAL INDEXED TRANSACTIONS
    // ===============================================

    const transactionResult =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM transactions
      `);

    const totalTransactions =
      Number(
        transactionResult.rows[0].total
      );


    // ===============================================
    // 3. TOTAL INDEXED BLOCKS
    // ===============================================

    const blockResult =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM blocks
      `);

    const totalBlocks =
      Number(
        blockResult.rows[0].total
      );


    // ===============================================
    // 4. READ REAL BLOCKCHAIN TRANSACTION COUNT
    // ===============================================

    let blockchainTransactions = 0;

    for (
      let blockNumber = 0;
      blockNumber <= latestBlock;
      blockNumber++
    ) {
      const block =
        await provider.getBlock(
          blockNumber
        );

      if (!block) {
        continue;
      }

      blockchainTransactions +=
        block.transactions.length;
    }


    // ===============================================
    // 5. CALCULATE COMPLETENESS
    // ===============================================

    const completeness =
      blockchainTransactions === 0
        ? 100
        : Number(
            (
              (
                totalTransactions /
                blockchainTransactions
              ) *
              100
            ).toFixed(2)
          );


    // Prevent completeness greater than 100
    const safeCompleteness =
      Math.min(
        completeness,
        100
      );


    // ===============================================
    // 6. VERIFICATION STATUS
    // ===============================================

    const verificationStatus =
      totalTransactions ===
      blockchainTransactions
        ? "Complete"
        : "Needs Verification";


    // ===============================================
    // 7. SUCCESS / FAILED TRANSACTIONS
    // ===============================================

    const statusResult =
      await pool.query(`
        SELECT
          status,
          COUNT(*) AS count
        FROM transactions
        GROUP BY status
      `);


    let successfulTransactions = 0;
    let failedTransactions = 0;

    for (
      const row of statusResult.rows
    ) {
      if (
        row.status.toLowerCase() ===
        "success"
      ) {
        successfulTransactions =
          Number(row.count);
      }

      if (
        row.status.toLowerCase() ===
        "failed"
      ) {
        failedTransactions =
          Number(row.count);
      }
    }


    // ===============================================
    // 8. RESPONSE
    // ===============================================

    res.json({
      success: true,

      latestBlock,

      blockchainTransactions,

      totalTransactions,

      totalBlocks,

      completeness:
        safeCompleteness,

      verificationStatus,

      successfulTransactions,

      failedTransactions,
    });

  } catch (error) {
    console.error(
      "Dashboard statistics error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch dashboard statistics",

      error:
        error.message,
    });
  }
});
// =====================================================
// REAL GANACHE WALLETS
// =====================================================

app.get("/api/blockchain/wallets", async (req, res) => {
  try {
    const accounts =
      await provider.send(
        "eth_accounts",
        []
      );

    const latestBlockNumber =
      await provider.getBlockNumber();

    const wallets = [];

    for (const address of accounts) {
      const balanceWei =
        await provider.getBalance(
          address
        );

      const balanceEth =
        ethers.formatEther(
          balanceWei
        );

      let transactionCount = 0;

      // ===============================================
      // COUNT TRANSACTIONS INVOLVING THIS WALLET
      // ===============================================

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }

        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;

          if (
            typeof transactionItem ===
            "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }

          if (!transaction) {
            continue;
          }

          const fromAddress =
            transaction.from
              ?.toLowerCase();

          const toAddress =
            transaction.to
              ?.toLowerCase();

          const currentAddress =
            address.toLowerCase();

          if (
            fromAddress === currentAddress ||
            toAddress === currentAddress
          ) {
            transactionCount++;
          }
        }
      }

      wallets.push({
        address,
        balance:
          Number(balanceEth)
            .toFixed(4),

        transactionCount,

        walletType:
          "Ganache Account",

        status:
          "Active",
      });
    }

    res.json({
      success: true,
      count: wallets.length,
      wallets,
    });

  } catch (error) {
    console.error(
      "Wallet fetch error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch Ganache wallets",

      error:
        error.message,
    });
  }
});
// =====================================================
// REAL GANACHE WALLET DETAILS
// =====================================================

app.get(
  "/api/blockchain/wallets/:address",
  async (req, res) => {
    try {
      const address =
        req.params.address;

      // ===============================================
      // VALIDATE ADDRESS
      // ===============================================

      if (!ethers.isAddress(address)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Ethereum wallet address",
        });
      }


      // ===============================================
      // GET REAL BALANCE
      // ===============================================

      const balanceWei =
        await provider.getBalance(
          address
        );

      const balance =
        ethers.formatEther(
          balanceWei
        );


      // ===============================================
      // GET LATEST BLOCK
      // ===============================================

      const latestBlockNumber =
        await provider.getBlockNumber();


      const sentTransactions = [];
      const receivedTransactions = [];


      // ===============================================
      // SCAN BLOCKCHAIN
      // ===============================================

      for (
        let blockNumber = 0;
        blockNumber <= latestBlockNumber;
        blockNumber++
      ) {
        const block =
          await provider.getBlock(
            blockNumber,
            true
          );

        if (!block) {
          continue;
        }


        for (
          const transactionItem of
          block.transactions
        ) {
          let transaction;


          if (
            typeof transactionItem ===
            "string"
          ) {
            transaction =
              await provider.getTransaction(
                transactionItem
              );
          } else {
            transaction =
              transactionItem;
          }


          if (!transaction) {
            continue;
          }


          const receipt =
            await provider.getTransactionReceipt(
              transaction.hash
            );


          const transactionData = {
            hash:
              transaction.hash,

            blockNumber:
              transaction.blockNumber,

            from:
              transaction.from,

            to:
              transaction.to,

            amount:
              ethers.formatEther(
                transaction.value
              ),

            status:
              receipt?.status === 1
                ? "Success"
                : "Failed",
          };


          // =============================================
          // SENT TRANSACTION
          // =============================================

          if (
            transaction.from
              ?.toLowerCase() ===
            address.toLowerCase()
          ) {
            sentTransactions.push(
              transactionData
            );
          }


          // =============================================
          // RECEIVED TRANSACTION
          // =============================================

          if (
            transaction.to
              ?.toLowerCase() ===
            address.toLowerCase()
          ) {
            receivedTransactions.push(
              transactionData
            );
          }
        }
      }


      // ===============================================
      // RESPONSE
      // ===============================================

      res.json({
        success: true,

        wallet: {
          address,

          balance:
            Number(balance)
              .toFixed(4),

          sentCount:
            sentTransactions.length,

          receivedCount:
            receivedTransactions.length,

          totalTransactions:
            sentTransactions.length +
            receivedTransactions.length,

          walletType:
            "Ganache Account",

          status:
            "Active",
        },

        sentTransactions,

        receivedTransactions,
      });

    } catch (error) {
      console.error(
        "Wallet details error:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch wallet details",

        error:
          error.message,
      });
    }
  }
);
app.listen(PORT, async () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  await testBlockchainConnection();

  // Start from current blockchain state
  lastIndexedBlock =
    await provider.getBlockNumber();

  console.log(
    `Automatic indexer started from block ${lastIndexedBlock}`
  );

  // Check Ganache every 3 seconds
  setInterval(
    indexNewBlocks,
    3000
  );
});
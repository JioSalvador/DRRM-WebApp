const pool = require('../../db');
const logAction = require('../../utils/logAction');

// GET all calendar tables with full data (columns, rows, cells)
const getAllCalendarTables = async (req, res) => {
  try {
    const tablesResult = await pool.query(`
      SELECT id, title
      FROM contents.calendar_tables
      ORDER BY id DESC
    `);
    const tables = tablesResult.rows;

    const fullTables = [];

    for (const table of tables) {
      const { id: tableId, title } = table;

      const columnsResult = await pool.query(
        `SELECT id, column_name AS name FROM contents.calendar_columns WHERE table_id = $1`,
        [tableId]
      );
      const columns = columnsResult.rows;

      const rowsResult = await pool.query(
        `SELECT id, row_label AS label FROM contents.calendar_rows WHERE table_id = $1 ORDER BY id`,
        [tableId]
      );
      const rows = rowsResult.rows;

      const cellsResult = await pool.query(
        `SELECT cc.id AS column_id, cr.id AS row_id, cell.value
         FROM contents.calendar_cells cell
         JOIN contents.calendar_columns cc ON cc.id = cell.column_id
         JOIN contents.calendar_rows cr ON cr.id = cell.row_id
         WHERE cc.table_id = $1 AND cr.table_id = $1`,
        [tableId]
      );

      const cellMap = {};
      cellsResult.rows.forEach(({ row_id, column_id, value }) => {
        if (!cellMap[row_id]) cellMap[row_id] = {};
        cellMap[row_id][column_id] = value;
      });

      fullTables.push({
        id: tableId,
        title,
        columns,
        rows: rows.map(row => ({
          id: row.id,
          label: row.label,
          cells: columns.map(col => ({
            columnId: col.id,
            value: cellMap[row.id]?.[col.id] || ''
          }))
        }))
      });
    }

    res.status(200).json({ success: true, tables: fullTables });
  } catch (err) {
    console.error('Error in getAllCalendarTables:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar tables.' });
  }
};

// CREATE new calendar table
const createCalendarTable = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contents.calendar_tables (title) VALUES ($1) RETURNING *',
      [title]
    );

    // ✅ Log creation
    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'create',
      targetType: 'calendar_table',
      targetId: result.rows[0].id,
      description: `Created calendar table titled "${title}"`
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ADD column
const addCalendarColumn = async (req, res) => {
  const { tableId } = req.params;
  const { name } = req.body;
  try {
    console.log('🧪 Adding column with:', { tableId, name });

    // 🧮 Get current number of columns to determine order
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM contents.calendar_columns WHERE table_id = $1',
      [tableId]
    );
    const order = parseInt(rows[0].count, 10);

    // ➕ Insert new column with calculated order
    const result = await pool.query(
      'INSERT INTO contents.calendar_columns (table_id, column_name, column_order) VALUES ($1, $2, $3) RETURNING *',
      [tableId, name, order]
    );

    // ✅ Log column addition
    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'add_column',
      targetType: 'calendar_table',
      targetId: tableId,
      description: `Added column "${name}" to calendar table ${tableId}`
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to add column:', err);
    res.status(400).json({ error: err.message });
  }
};

// ADD row
const addCalendarRow = async (req, res) => {
  const { tableId } = req.params;
  const { label } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contents.calendar_rows (table_id, row_label) VALUES ($1, $2) RETURNING *',
      [tableId, label]
    );

    // ✅ Log row addition
    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'add_row',
      targetType: 'calendar_table',
      targetId: tableId,
      description: `Added row "${label}" to calendar table ${tableId}`
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE or INSERT a cell
const updateCalendarCell = async (req, res) => {
  const { rowId, columnId } = req.params;
  const { value } = req.body;
  try {
    const existing = await pool.query(
      `SELECT * FROM contents.calendar_cells 
       WHERE row_id = $1 AND column_id = $2`,
      [rowId, columnId]
    );

    if (existing.rows.length > 0) {
      const update = await pool.query(
        `UPDATE contents.calendar_cells 
         SET value = $1 
         WHERE row_id = $2 AND column_id = $3 
         RETURNING *`,
        [value, rowId, columnId]
      );

      // ✅ Log update
      await logAction({
        userId: req.user.id,
        role: req.user.role,
        action: 'update_cell',
        targetType: 'calendar_cell',
        targetId: update.rows[0].id,
        description: `Updated cell at row ${rowId}, column ${columnId} to "${value}"`
      });

      res.status(200).json(update.rows[0]);
    } else {
      const insert = await pool.query(
        `INSERT INTO contents.calendar_cells (row_id, column_id, value) 
         VALUES ($1, $2, $3) RETURNING *`,
        [rowId, columnId, value]
      );

      // ✅ Log insert
      await logAction({
        userId: req.user.id,
        role: req.user.role,
        action: 'create_cell',
        targetType: 'calendar_cell',
        targetId: insert.rows[0].id,
        description: `Inserted new cell at row ${rowId}, column ${columnId} with value "${value}"`
      });

      res.status(201).json(insert.rows[0]);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET a specific calendar table by ID
const getFullCalendar = async (req, res) => {
  const { tableId } = req.params;
  try {
    const table = await pool.query('SELECT * FROM contents.calendar_tables WHERE id = $1', [tableId]);
    const columns = await pool.query('SELECT * FROM contents.calendar_columns WHERE table_id = $1', [tableId]);
    const rows = await pool.query('SELECT * FROM contents.calendar_rows WHERE table_id = $1', [tableId]);
    const cells = await pool.query(`
      SELECT * FROM contents.calendar_cells 
      WHERE row_id IN (SELECT id FROM contents.calendar_rows WHERE table_id = $1)
    `, [tableId]);

    res.status(200).json({
      table: table.rows[0],
      columns: columns.rows,
      rows: rows.rows,
      cells: cells.rows,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// calendarController.js
const deleteCalendarTable = async (req, res) => {
  const { tableId } = req.params;
  try {
    await pool.query('DELETE FROM contents.calendar_tables WHERE id = $1', [tableId]);

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'delete',
      targetType: 'calendar_table',
      targetId: tableId,
      description: `Deleted calendar table ${tableId}`
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete table:', err);
    res.status(400).json({ error: err.message });
  }
};
const deleteCalendarRow = async (req, res) => {
  const { rowId } = req.params;
  try {
    await pool.query('DELETE FROM contents.calendar_rows WHERE id = $1', [rowId]);

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'delete_row',
      targetType: 'calendar_row',
      targetId: rowId,
      description: `Deleted row ${rowId} from calendar table`
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete row:', err);
    res.status(400).json({ error: err.message });
  }
};
const deleteCalendarColumn = async (req, res) => {
  const { columnId } = req.params;
  try {
    await pool.query('DELETE FROM contents.calendar_columns WHERE id = $1', [columnId]);

    await logAction({
      userId: req.user.id,
      role: req.user.role,
      action: 'delete_column',
      targetType: 'calendar_column',
      targetId: columnId,
      description: `Deleted column ${columnId} from calendar table`
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete column:', err);
    res.status(400).json({ error: err.message });
  }
};


module.exports = {
  createCalendarTable,
  addCalendarColumn,
  addCalendarRow,
  updateCalendarCell,
  getFullCalendar,
  getAllCalendarTables,
  deleteCalendarTable,
  deleteCalendarRow,
  deleteCalendarColumn
};
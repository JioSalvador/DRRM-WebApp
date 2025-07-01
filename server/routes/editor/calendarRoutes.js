const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const roleGuard = require('../../middleware/roleGuard');
const {
  createCalendarTable,
  addCalendarColumn,
  addCalendarRow,
  updateCalendarCell,
  getFullCalendar,
  getAllCalendarTables,
  deleteCalendarTable,
  deleteCalendarRow,
  deleteCalendarColumn,
} = require('../../controllers/editor/calendarController');

router.get('/', getAllCalendarTables);

// All routes below require the user to be an editor
router.use(verifyToken, roleGuard('editor'));

// Create a new calendar table
router.post('/', createCalendarTable);

// Add a column to a table
router.post('/:tableId/columns', addCalendarColumn);

// Add a row to a table
router.post('/:tableId/rows', addCalendarRow);

// Update or insert a cell
router.put('/cells/:rowId/:columnId', updateCalendarCell);

// Get full table (columns, rows, cells)
router.get('/:tableId', getFullCalendar);

// calendarRoutes.js
router.delete('/:tableId', verifyToken, roleGuard('editor'), deleteCalendarTable);
router.delete('/rows/:rowId', verifyToken, roleGuard('editor'), deleteCalendarRow);
router.delete('/columns/:columnId', verifyToken, roleGuard('editor'), deleteCalendarColumn);

module.exports = router;
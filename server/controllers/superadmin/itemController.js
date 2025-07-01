const pool = require('../../db');

const addItem = async (req, res) => {
  try {
    const { name, description, unit_price, is_active = true } = req.body;

    if (!name || !description || unit_price == null) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const itemExists = await pool.query(
      'SELECT 1 FROM services.document_types WHERE name = $1',
      [name]
    );

    if (itemExists.rows.length > 0) {
      return res.status(409).json({ message: 'An item with that name already exists!' });
    }

    await pool.query(
      `INSERT INTO services.document_types (name, description, unit_price, is_active)
       VALUES ($1, $2, $3, $4)`,
      [name.trim(), description.trim(), parseFloat(unit_price), is_active]
    );

    res.status(201).json({ message: 'The item has been added!' });
  } catch (err) {
    console.error('Error in addItem:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getAllItems = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, unit_price FROM services.document_types WHERE is_active = true ORDER BY name'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getItemById = async (req, res) => {
    try{
        const { itemId } = req.params;

        const result = await pool.query(
            'SELECT * FROM services.document_types WHERE id = $1',
            [itemId]
        );

        if (result.rows.length === 0){
            return res.status(404).json({message: 'Item does not exist!'});
        }

        res.status(200).json(result.rows[0]);
    }catch(err){
        res.status(400).json({error: err.message});
    }
};

const updateItem = async (req, res) => {
    try{
        const { itemId } = req.params;
        const { description, unit_price, is_active = true } = req.body;

        const itemExists = await pool.query(
            'SELECT * FROM services.document_types WHERE id = $1',
            [itemId]
        );

        if(itemExists.rows.length === 0){
            return res.status(404).json({message: 'Item does not exist!'});
        }

        const current = itemExists.rows[0];

        const newDescription = description ?? current.description;
        const newUnit_price = unit_price ?? current.unit_price;
        const newIs_active = is_active ?? current.is_active;

        const result = await pool.query(
            'UPDATE services.document_types SET description = $1, unit_price = $2, is_active = $3 WHERE id = $4 RETURNING *',
            [newDescription, newUnit_price, newIs_active, itemId]
        );

        res.status(200).json(result.rows[0]);
    }catch(err){
        res.status(400).json({error: err.message});
    }
};

const deleteItem = async (req, res) => {
    try{
        const { itemId } = req.params;

        const result = await pool.query(
            'DELETE FROM services.document_types WHERE id = $1 RETURNING *',
            [itemId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({message: 'Item does not exist!'});
        }
        
        res.status(200).json({message: 'Item deleted successfully!'});
    }catch(err){
        res.status(400).json({message: err.message});
    }
}

module.exports = {
  addItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
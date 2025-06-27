// src/controllers/fnbController.js

const { getDatabase } = require('../config/database');
const { isValidJson } = require('../utils/helpers');

/**
 * Get the Food & Beverage menu, categorized.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.getFnbMenu = async (req, res, next) => {
    const db = getDatabase();
    try {
        const snacks = await db.all(`
            SELECT id, name, description, category, price, size, is_veg FROM snacks ORDER BY category, name;
        `);

        // Group snacks by category, including combos
        const categoriesMap = {};
        for (const snack of snacks) {
            const categoryKey = snack.category.toLowerCase();
            if (!categoriesMap[categoryKey]) {
                categoriesMap[categoryKey] = {
                    name: snack.category,
                    items: []
                };
            }
            categoriesMap[categoryKey].items.push({
                id: snack.id,
                name: snack.name,
                // description: snack.description, // Removed description as per example
                size: snack.size,
                price: snack.price,
                isVeg: snack.is_veg === 1 // Convert integer to boolean
            });
        }

        // If combos exist, move them to a separate 'combos' category at the end
        let combos = [];
        if (categoriesMap['combo']) {
            combos = categoriesMap['combo'].items;
            delete categoriesMap['combo'];
        }

        const categories = Object.values(categoriesMap);
        if (combos.length > 0) {
            categories.push({ name: 'Combos', items: combos });
        }

        res.status(200).json({
            success: true,
            categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add Food & Beverage items to an existing booking.
 * Updates booking total and creates food order entries.
 * @param {Object} req - Express request object (requires authentication via req.user).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.orderFnb = async (req, res, next) => {
    const { bookingId, items } = req.body;
    const userId = req.user.id;
    const db = getDatabase();

    let transactionStarted = false;

    try {
        await db.run('BEGIN TRANSACTION;');
        transactionStarted = true;

        // Step 1: Verify booking exists and belongs to the user, and is confirmed
        const booking = await db.get(`
            SELECT id, total_amount, booking_status, payment_status FROM bookings
            WHERE booking_reference = ? AND user_id = ?;
        `, [bookingId, userId]);

        if (!booking) {
            throw new Error('No rows found: Booking not found or not authorized.');
        }
        if (booking.booking_status !== 'confirmed' || booking.payment_status !== 'paid') {
            throw new Error('F&B can only be added to a confirmed and paid booking.');
        }

        let fnbTotal = 0;
        const orderedItemsDetails = [];

        // Step 2: Validate F&B items and calculate their total cost (including combos)
        for (const item of items) {
            const snack = await db.get('SELECT id, name, price, category FROM snacks WHERE id = ?', [item.itemId]);
            if (!snack) {
                throw new Error(`Snack with ID ${item.itemId} not found.`);
            }
            if (item.quantity <= 0) {
                throw new Error(`Invalid quantity for snack ${snack.name}.`);
            }
            // If combo, you could add special logic here (e.g., discount, bundle validation)
            // For now, just treat as a regular item with its price
            const itemPrice = snack.price * item.quantity;
            fnbTotal += itemPrice;

            orderedItemsDetails.push({
                snackId: snack.id,
                name: snack.name,
                quantity: item.quantity,
                unitPrice: snack.price,
                totalPrice: itemPrice,
                category: snack.category
            });

            // Insert into food_orders table
            await db.run(
                'INSERT INTO food_orders (booking_id, snack_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
                [booking.id, snack.id, item.quantity, snack.price]
            );
        }

        // Step 3: Update booking's total amount
        const newTotalAmount = booking.total_amount + fnbTotal;
        await db.run(
            'UPDATE bookings SET total_amount = ? WHERE id = ?',
            [newTotalAmount, booking.id]
        );

        await db.run('COMMIT;');
        transactionStarted = false;

        res.status(200).json({
            success: true,
            message: 'Food and beverage order added successfully.',
            bookingId: bookingId, // Return bookingId as string reference
            updatedTotalAmount: parseFloat(newTotalAmount.toFixed(2)),
            orderedItems: orderedItemsDetails
        });

    } catch (error) {
        if (transactionStarted) {
            await db.run('ROLLBACK;');
        }
        next(error);
    }
};

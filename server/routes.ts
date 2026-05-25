import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User, Book, Cart, Wishlist, Order } from './db.js';
import {
  generateAIBookDescription,
  generateSmartSearchSuggestions,
  getAISimilarBooks,
  getAIPersonalizedRecommendations
} from './ai.js';

const JWT_SECRET = process.env.JWT_SECRET || 'online_bookstore_secret_jwt_key_2026_xYz987';
const router = Router();

// Middleware: Authenticate User JWT from Authorization header
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No active token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is invalid or expired.' });
  }
}

// Middleware: Admin role check
export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access forbidden. Admin role required.' });
    return;
  }
  next();
}

/**
 * Bootstrapping: Seed sample admin and user accounts if database is empty
 */
export async function seedUsers() {
  try {
    const adminEmail = 'admin@bookstore.com';
    const userEmail = 'user@bookstore.com';
    
    const existingAdmin = await db.users.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      await db.users.insertOne({
        _id: 'user_admin_001',
        username: 'System Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Successfully seeded default admin user: admin@bookstore.com');
    }

    const existingUser = await db.users.findOne({ email: userEmail });
    if (!existingUser) {
      const userPasswordHash = bcrypt.hashSync('user123', 10);
      await db.users.insertOne({
        _id: 'user_regular_002',
        username: 'Raunak Sarkar',
        email: userEmail,
        passwordHash: userPasswordHash,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      console.log('Successfully seeded default test user: user@bookstore.com');
    }
  } catch (error) {
    console.error('Error bootstrapping default admin/user seeds:', error);
  }
}

// Initialize seeds
seedUsers();

// ========================
// AUTHENTICATION APIs
// ========================

// POST /api/auth/register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required.' });
      return;
    }

    const uppercaseEmail = email.toLowerCase().trim();
    const existing = await db.users.findOne({ email: uppercaseEmail });
    if (existing) {
      res.status(400).json({ error: 'Account with this email already exists.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = 'user_' + Math.random().toString(36).substring(2, 11);
    
    const newUser: User = {
      _id: userId,
      username: username.trim(),
      email: uppercaseEmail,
      passwordHash,
      role: 'user', // defaults to user
      createdAt: new Date().toISOString()
    };

    await db.users.insertOne(newUser);

    // Create session JWT
    const token = jwt.sign(
      { _id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal registration error' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: lowercaseEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal login error' });
  }
});

// GET /api/auth/me
router.get('/auth/me', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User info not resolved' });
      return;
    }
    const user = await db.users.findOne({ _id: req.user._id });
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal authentication fetch error' });
  }
});

// ========================
// BOOK INVENTORY APIs
// ========================

// GET /api/books (Browse books + Search/Filter)
router.get('/books', async (req: Request, res: Response) => {
  try {
    const { q, category, trending, limit } = req.query;
    let booksList = await db.books.find({});

    // Filter by category
    if (category && typeof category === 'string' && category !== 'All') {
      booksList = booksList.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by search terms (offline backup filter)
    if (q && typeof q === 'string') {
      const queryStr = q.toLowerCase().trim();
      booksList = booksList.filter(b => 
        b.title.toLowerCase().includes(queryStr) ||
        b.author.toLowerCase().includes(queryStr) ||
        b.category.toLowerCase().includes(queryStr) ||
        (b.description && b.description.toLowerCase().includes(queryStr))
      );
    }

    // Filter by trending
    if (trending === 'true') {
      booksList = booksList.filter(b => b.isTrending === true);
    }

    // Sort by sales or rating or title
    booksList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Support pagination limits if specified
    if (limit && !isNaN(Number(limit))) {
      booksList = booksList.slice(0, Number(limit));
    }

    res.json(booksList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error listing books' });
  }
});

// GET /api/books/:id
router.get('/books/:id', async (req: Request, res: Response) => {
  try {
    const found = await db.books.findOne({ _id: req.params.id });
    if (!found) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(found);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error getting book details' });
  }
});

// POST /api/books (Admin Add New Book)
router.post('/books', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const { title, author, description, price, category, stock, coverUrl, isTrending, aiSummary } = req.body;
    if (!title || !author || !price || !category) {
      res.status(400).json({ error: 'Title, Author, Price and Category are required.' });
      return;
    }

    const newBook: Book = {
      _id: 'book_' + Math.random().toString(36).substring(2, 11),
      title: title.trim(),
      author: author.trim(),
      description: description ? description.trim() : 'No description provided.',
      price: Number(price),
      category: category.trim(),
      stock: stock ? Number(stock) : 10,
      coverUrl: coverUrl ? coverUrl.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
      rating: 4.5,
      ratingCount: 1,
      salesCount: 0,
      isTrending: !!isTrending,
      aiSummary: aiSummary || '',
      createdAt: new Date().toISOString()
    };

    await db.books.insertOne(newBook);
    res.status(201).json({ message: 'Book created successfully', book: newBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error inserting book' });
  }
});

// PUT /api/books/:id (Admin Edit Book)
router.put('/books/:id', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const { title, author, description, price, category, stock, coverUrl, isTrending, aiSummary, rating } = req.body;
    const found = await db.books.findOne({ _id: req.params.id });
    if (!found) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const updatedData: Partial<Book> = {
      title: title !== undefined ? title.trim() : found.title,
      author: author !== undefined ? author.trim() : found.author,
      description: description !== undefined ? description.trim() : found.description,
      price: price !== undefined ? Number(price) : found.price,
      category: category !== undefined ? category.trim() : found.category,
      stock: stock !== undefined ? Number(stock) : found.stock,
      coverUrl: coverUrl !== undefined ? coverUrl.trim() : found.coverUrl,
      isTrending: isTrending !== undefined ? !!isTrending : found.isTrending,
      aiSummary: aiSummary !== undefined ? aiSummary.trim() : found.aiSummary,
      rating: rating !== undefined ? Number(rating) : found.rating
    };

    await db.books.updateOne({ _id: req.params.id }, updatedData);
    res.json({ message: 'Book updated successfully', book: { ...found, ...updatedData } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating book' });
  }
});

// DELETE /api/books/:id (Admin Delete Book)
router.delete('/books/:id', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const found = await db.books.findOne({ _id: req.params.id });
    if (!found) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    await db.books.deleteOne({ _id: req.params.id });
    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting book' });
  }
});

// ========================
// CART APIs
// ========================

// GET /api/cart
router.get('/cart', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }
    let cart = await db.carts.findOne({ userId: req.user._id });
    if (!cart) {
      cart = { userId: req.user._id, items: [], updatedAt: new Date().toISOString() };
      await db.carts.insertOne(cart);
    }
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error getting cart' });
  }
});

// POST /api/cart (Add to cart)
router.post('/cart', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId, quantity } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'Book ID is required' });
      return;
    }

    const qty = quantity ? Number(quantity) : 1;
    const targetBook = await db.books.findOne({ _id: bookId });
    if (!targetBook) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (targetBook.stock < qty) {
      res.status(400).json({ error: `Not enough stock available. Remaining stock: ${targetBook.stock}` });
      return;
    }

    let cart = await db.carts.findOne({ userId: req.user!._id });
    if (!cart) {
      cart = {
        userId: req.user!._id,
        items: [{ bookId, quantity: qty }],
        updatedAt: new Date().toISOString()
      };
      await db.carts.insertOne(cart);
    } else {
      const idx = cart.items.findIndex(item => item.bookId === bookId);
      if (idx !== -1) {
        cart.items[idx].quantity += qty;
      } else {
        cart.items.push({ bookId, quantity: qty });
      }
      cart.updatedAt = new Date().toISOString();
      await db.carts.updateOne({ userId: req.user!._id }, { items: cart.items, updatedAt: cart.updatedAt });
    }

    res.json({ message: 'Cart updated successfully', cart });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error adding to cart' });
  }
});

// PUT /api/cart/:bookId/quantity (Update quantity)
router.put('/cart/:bookId/quantity', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const { bookId } = req.params;
    
    if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) < 1) {
      res.status(400).json({ error: 'A valid stock quantity is required' });
      return;
    }

    const targetBook = await db.books.findOne({ _id: bookId });
    if (!targetBook) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (targetBook.stock < Number(quantity)) {
      res.status(400).json({ error: `Insufficient stock. Max available: ${targetBook.stock}` });
      return;
    }

    let cart = await db.carts.findOne({ userId: req.user!._id });
    if (!cart) {
      res.status(404).json({ error: 'No active cart found for this user.' });
      return;
    }

    const idx = cart.items.findIndex(item => item.bookId === bookId);
    if (idx !== -1) {
      cart.items[idx].quantity = Number(quantity);
      cart.updatedAt = new Date().toISOString();
      await db.carts.updateOne({ userId: req.user!._id }, { items: cart.items, updatedAt: cart.updatedAt });
      res.json({ message: 'Cart item quantity updated', cart });
    } else {
      res.status(404).json({ error: 'Item not found in your cart.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating item quantity' });
  }
});

// DELETE /api/cart/:bookId (Remove item from cart)
router.delete('/cart/:bookId', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId } = req.params;
    let cart = await db.carts.findOne({ userId: req.user!._id });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter(item => item.bookId !== bookId);
    cart.updatedAt = new Date().toISOString();
    await db.carts.updateOne({ userId: req.user!._id }, { items: cart.items, updatedAt: cart.updatedAt });
    
    res.json({ message: 'Book successfully removed from your cart.', cart });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting item from cart' });
  }
});

// ========================
// WISHLIST APIs
// ========================

// GET /api/wishlist
router.get('/wishlist', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let wishlist = await db.wishlists.findOne({ userId: req.user!._id });
    if (!wishlist) {
      wishlist = { userId: req.user!._id, bookIds: [], updatedAt: new Date().toISOString() };
      await db.wishlists.insertOne(wishlist);
    }
    res.json(wishlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error getting wishlist' });
  }
});

// POST /api/wishlist (Toggle item in wishlist)
router.post('/wishlist', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'Book ID is required' });
      return;
    }

    const targetBook = await db.books.findOne({ _id: bookId });
    if (!targetBook) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    let wishlist = await db.wishlists.findOne({ userId: req.user!._id });
    let isAdded = false;

    if (!wishlist) {
      wishlist = {
        userId: req.user!._id,
        bookIds: [bookId],
        updatedAt: new Date().toISOString()
      };
      await db.wishlists.insertOne(wishlist);
      isAdded = true;
    } else {
      const idx = wishlist.bookIds.indexOf(bookId);
      if (idx !== -1) {
        wishlist.bookIds.splice(idx, 1);
        isAdded = false;
      } else {
        wishlist.bookIds.push(bookId);
        isAdded = true;
      }
      wishlist.updatedAt = new Date().toISOString();
      await db.wishlists.updateOne({ userId: req.user!._id }, { bookIds: wishlist.bookIds, updatedAt: wishlist.updatedAt });
    }

    res.json({
      message: isAdded ? 'Book added to your wishlist' : 'Book removed from your wishlist',
      wishlist,
      isWishlisted: isAdded
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error toggling wishlist' });
  }
});

// ========================
// ORDER / CHECKOUT APIs
// ========================

// POST /api/orders (Create Order / Checkout)
router.post('/orders', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Checkout requires a list of items.' });
      return;
    }
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city) {
      res.status(400).json({ error: 'Complete shipping address is required.' });
      return;
    }

    // Verify stock and fetch items details
    const orderItems: Array<{
      bookId: string;
      title: string;
      author: string;
      price: number;
      quantity: number;
      coverUrl: string;
    }> = [];

    let total = 0;

    for (const requestedItem of items) {
      const book = await db.books.findOne({ _id: requestedItem.bookId });
      if (!book) {
        res.status(404).json({ error: `Book item ${requestedItem.bookId} does not exist.` });
        return;
      }

      if (book.stock < requestedItem.quantity) {
        res.status(400).json({ error: `Insufficient stock for "${book.title}". Available: ${book.stock}` });
        return;
      }

      // Add to array
      orderItems.push({
        bookId: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: requestedItem.quantity,
        coverUrl: book.coverUrl
      });

      total += book.price * requestedItem.quantity;
      
      // Deduct stock and increment salesCount
      await db.books.updateOne({ _id: book._id }, {
        stock: book.stock - requestedItem.quantity,
        salesCount: (book.salesCount || 0) + requestedItem.quantity
      });
    }

    // Generate Invoice Number
    const count = await db.orders.countDocuments();
    const invoiceNo = `BKA-${new Date().getFullYear()}-${1000 + count + 1}`;

    const newOrder: Order = {
      _id: 'order_' + Math.random().toString(36).substring(2, 11),
      userId: req.user!._id,
      username: req.user!.username,
      email: req.user!.email,
      items: orderItems,
      totalAmount: total,
      status: 'Pending',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'Unpaid' : 'Paid', // immediate payment for stripe/lucide simulator
      shippingAddress,
      invoiceNo,
      createdAt: new Date().toISOString()
    };

    await db.orders.insertOne(newOrder);

    // Clear user's cart on successful checkout
    await db.carts.updateOne({ userId: req.user!._id }, { items: [], updatedAt: new Date().toISOString() });

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error processing your checkout order' });
  }
});

// GET /api/orders (User view their orders)
router.get('/orders', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await db.orders.find({ userId: req.user!._id });
    orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching user orders' });
  }
});

// ========================
// ADMIN CONTROL APIs
// ========================

// GET /api/admin/orders (Admin view all orders)
router.get('/admin/orders', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const orders = await db.orders.find({});
    orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching admin orders' });
  }
});

// PUT /api/admin/orders/:id (Admin update order status & payment status)
router.put('/admin/orders/:id', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;
    const found = await db.orders.findOne({ _id: req.params.id });
    if (!found) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updated: Partial<Order> = {};
    if (status) updated.status = status;
    if (paymentStatus) updated.paymentStatus = paymentStatus;

    await db.orders.updateOne({ _id: req.params.id }, updated);
    res.json({ message: 'Order status updated successfully', order: { ...found, ...updated } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating order info' });
  }
});

// GET /api/admin/users (Admin review user management)
router.get('/admin/users', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.users.find({});
    const secureUsers = allUsers.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));
    res.json(secureUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error returning user entries' });
  }
});

// PUT /api/admin/users/:id/role (Change user role)
router.put('/admin/users/:id/role', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || (role !== 'user' && role !== 'admin')) {
      res.status(400).json({ error: 'Invalid role assignment' });
      return;
    }

    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await db.users.updateOne({ _id: req.params.id }, { role });
    res.json({ message: `Success. User designated as ${role}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error changing user status' });
  }
});

// DELETE /api/admin/users/:id (Admin delete user)
router.delete('/admin/users/:id', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user._id === 'user_admin_001') {
      res.status(400).json({ error: 'The seed system admin cannot be deleted!' });
      return;
    }

    await db.users.deleteOne({ _id: req.params.id });
    res.json({ message: 'User account removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting user entry' });
  }
});

// GET /api/admin/analytics (Compute statistics of bookstore)
router.get('/admin/analytics', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const allBooks = await db.books.find({});
    const allOrders = await db.orders.find({});
    const allUsers = await db.users.find({});

    // Calculations
    const salesCountSum = allBooks.reduce((sum, b) => sum + (b.salesCount || 0), 0);
    const totalUsersCount = allUsers.length;
    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === 'Paid' || o.status === 'Delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Grouping by categories
    const categoryGroup: Record<string, { count: number; stock: number }> = {};
    allBooks.forEach(b => {
      if (!categoryGroup[b.category]) {
        categoryGroup[b.category] = { count: 0, stock: 0 };
      }
      categoryGroup[b.category].count += 1;
      categoryGroup[b.category].stock += b.stock;
    });

    const categoriesAnalyzed = Object.keys(categoryGroup).map(cat => ({
      name: cat,
      bookCount: categoryGroup[cat].count,
      totalStock: categoryGroup[cat].stock
    }));

    // Top selling books
    const sortedBySales = [...allBooks].sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0));
    const topSellers = sortedBySales.slice(0, 5).map(b => ({
      _id: b._id,
      title: b.title,
      author: b.author,
      category: b.category,
      salesCount: b.salesCount || 0,
      revenueAmount: (b.salesCount || 0) * b.price
    }));

    // Inventory warning (< 10 books left)
    const criticalStock = allBooks
      .filter(b => b.stock < 10)
      .map(b => ({ _id: b._id, title: b.title, stock: b.stock, category: b.category }));

    res.json({
      totalSales: salesCountSum,
      totalRevenue,
      totalBooks: allBooks.length,
      totalUsers: totalUsersCount,
      categoriesAnalyzed,
      topSellers,
      inventoryWarnings: criticalStock
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error generating dashboard statistics' });
  }
});

// ========================
// AI SPECIFIC CONTROLLERS
// ========================

// POST /api/ai/describe (Admin generate AI book description)
router.post('/ai/describe', authMiddleware as any, adminMiddleware as any, async (req: Request, res: Response) => {
  try {
    const { title, author, category } = req.body;
    if (!title || !author || !category) {
      res.status(400).json({ error: 'Title, Author and Category are required to generate descriptive summaries' });
      return;
    }

    const aiOutput = await generateAIBookDescription(title, author, category);
    res.json(aiOutput);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed generated AI content' });
  }
});

// POST /api/ai/search (Smart conceptual search)
router.post('/ai/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.body;
    if (!q) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const allBooks = await db.books.find({});
    const searchContext = await generateSmartSearchSuggestions(q, allBooks);
    res.json(searchContext);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gemini error processing spelling check' });
  }
});

// GET /api/ai/similar/:bookId (Similar items)
router.get('/ai/similar/:bookId', async (req: Request, res: Response) => {
  try {
    const book = await db.books.findOne({ _id: req.params.bookId });
    if (!book) {
      res.status(404).json({ error: 'Target book reference not found.' });
      return;
    }

    const allBooks = await db.books.find({});
    const similarIds = await getAISimilarBooks(book, allBooks);
    
    // Fetch matched book structures
    const similarBooks = allBooks.filter(b => similarIds.includes(b._id));
    // If fewer than requested, fill with same-category or random
    if (similarBooks.length < 3) {
      const extra = allBooks.filter(b => b._id !== book._id && b.category === book.category && !similarIds.includes(b._id));
      similarBooks.push(...extra);
    }

    res.json(similarBooks.slice(0, 3));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed delivering similar recommendation links' });
  }
});

// GET /api/ai/recommendations (Personalized recommendations based on User reading habits)
router.get('/ai/recommendations', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    // Extract everything from Wishlist, Cart and user Orders
    const wishlist = await db.wishlists.findOne({ userId });
    const cart = await db.carts.findOne({ userId });
    const orders = await db.orders.find({ userId });

    const interestedBookIds = new Set<string>();
    
    if (wishlist) wishlist.bookIds.forEach(id => interestedBookIds.add(id));
    if (cart) cart.items.forEach(item => interestedBookIds.add(item.bookId));
    orders.forEach(ord => ord.items.forEach(item => interestedBookIds.add(item.bookId)));

    const allBooks = await db.books.find({});
    const interestArr = Array.from(interestedBookIds);

    const matchReasons = await getAIPersonalizedRecommendations(interestArr, allBooks);
    
    // Construct response with complete book objects
    const recommendationsPayload = matchReasons.map(rec => {
      const bObj = allBooks.find(b => b._id === rec.bookId);
      if (bObj) {
        return {
          book: bObj,
          reason: rec.reason
        };
      }
      return null;
    }).filter(Boolean);

    res.json(recommendationsPayload);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error generating customized bookshelf context' });
  }
});

export default router;

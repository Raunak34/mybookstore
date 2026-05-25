import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';

// Ensure the local data folder exists for the fallback JSON database
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interfaces representation
export interface User {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  coverUrl: string;
  rating: number;
  ratingCount: number;
  salesCount: number;
  isTrending: boolean;
  aiSummary?: string;
  createdAt: string;
}

export interface CartItem {
  bookId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Wishlist {
  userId: string;
  bookIds: string[];
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  username: string;
  email: string;
  items: Array<{
    bookId: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
    coverUrl: string;
  }>;
  totalAmount: number;
  status: 'Pending' | 'processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Stripe' | 'Razorpay' | 'COD';
  paymentStatus: 'Paid' | 'Unpaid' | 'Failed';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  invoiceNo: string;
  createdAt: string;
}

// Seed Data
const DEFAULT_BOOKS: Book[] = [
  {
    _id: "book_001",
    title: "The Phoenix Project",
    author: "Gene Kim, Kevin Behr & George Spafford",
    description: "A novel about IT, DevOps, and helping your business win. The Phoenix Project is a classic read for anyone trying to understand modern technology operations, cloud transition, and breaking down department silos.",
    price: 29.99,
    category: "Technology & Coding",
    stock: 25,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    ratingCount: 1240,
    salesCount: 840,
    isTrending: true,
    aiSummary: "Explore IT workflow streamlining, DevOps principles, and continuous integration through a highly relatable narrative structure starring beleaguered IT executives.",
    createdAt: new Date("2026-01-10").toISOString()
  },
  {
    _id: "book_002",
    title: "Steve Jobs",
    author: "Walter Isaacson",
    description: "The exclusive biography of Steve Jobs, based on more than forty interviews with Jobs conducted over two years—as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues.",
    price: 34.99,
    category: "Biographies & Philosophy",
    stock: 12,
    coverUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    ratingCount: 3102,
    salesCount: 1540,
    isTrending: true,
    aiSummary: "A meticulous account of Jobs' obsession with sleek design, technical minimalism, business innovation, and intense visionary management that redefined computing.",
    createdAt: new Date("2026-02-15").toISOString()
  },
  {
    _id: "book_003",
    title: "Dune",
    author: "Frank Herbert",
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who would become the mysterious man known as Muad'Dib. He will avenge the traitorous plot against his noble family and bring to fruition mankind’s most ancient and unattainable dream.",
    price: 18.99,
    category: "Sci-Fi & Fantasy",
    stock: 35,
    coverUrl: "https://images.unsplash.com/photo-1506466010722-395ee2bef877?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    ratingCount: 4500,
    salesCount: 2110,
    isTrending: true,
    aiSummary: "A grand epic investigating resource geopolitics, socio-ecological feedback loops, dynastic conflict, and the danger of messianic figures in human society.",
    createdAt: new Date("2026-03-01").toISOString()
  },
  {
    _id: "book_004",
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. This book is a must-buy for any engineer looking to improve.",
    price: 39.99,
    category: "Technology & Coding",
    stock: 50,
    coverUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400",
    rating: 4.6,
    ratingCount: 1980,
    salesCount: 940,
    isTrending: false,
    aiSummary: "A guide detailing professional software craftsmanship, highlighting readable code layout, intuitive naming conventions, micro-sized methods, and rigorous automated testing.",
    createdAt: new Date("2025-11-20").toISOString()
  },
  {
    _id: "book_005",
    title: "Zero to One",
    author: "Peter Thiel",
    description: "The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. In Zero to One, legendary entrepreneur and investor Peter Thiel shows how we can find singular ways to create those new things.",
    price: 24.99,
    category: "Business & Startups",
    stock: 15,
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    rating: 4.5,
    ratingCount: 1540,
    salesCount: 720,
    isTrending: true,
    aiSummary: "An exploration of vertical scaling in business. Proposes building monopolies around unique innovations rather than competing horizontally in established markets.",
    createdAt: new Date("2026-04-05").toISOString()
  },
  {
    _id: "book_006",
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    description: "One of the most significant books on software development ever written. This book cuts through the increasing specialization and technical jargon of modern software engineering to examine the core process of code crafting.",
    price: 42.99,
    category: "Technology & Coding",
    stock: 18,
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    ratingCount: 2201,
    salesCount: 1100,
    isTrending: false,
    aiSummary: "Deep, practical lessons on user agency, defensive debugging, decoupled architectures, strict refactoring, and flexible career learning for programmers.",
    createdAt: new Date("2026-02-28").toISOString()
  },
  {
    _id: "book_007",
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "Paulo Coelho's masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. Santiago discovers treasures and wisdom that are far more satisfying.",
    price: 14.99,
    category: "Fiction & Literature",
    stock: 40,
    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    ratingCount: 5120,
    salesCount: 3050,
    isTrending: false,
    aiSummary: "An allegorical fable emphasizing active pursuit of one's personal calling, listening directly to your heart, and interpreting universal omens.",
    createdAt: new Date("2025-10-15").toISOString()
  },
  {
    _id: "book_008",
    title: "Atomic Habits",
    author: "James Clear",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits.",
    price: 21.99,
    category: "Business & Startups",
    stock: 30,
    coverUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    ratingCount: 6200,
    salesCount: 4200,
    isTrending: true,
    aiSummary: "Provides a behavioral science framework (cue, craving, response, reward) to implement marginal returns (1% daily improvements) and structure stable habits.",
    createdAt: new Date("2026-03-24").toISOString()
  },
  {
    _id: "book_009",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    description: "Destined to become a modern classic, Sapiens is a sweeping narrative of humanity's creation and evolution. Dr. Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to the radical breakthroughs of today.",
    price: 26.99,
    category: "Biographies & Philosophy",
    stock: 22,
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    ratingCount: 3410,
    salesCount: 1290,
    isTrending: false,
    aiSummary: "Chronicles cognitive, agricultural, and scientific developments by examining how shared myths and inter-subjective constructs unified collaborative human grids.",
    createdAt: new Date("2026-01-05").toISOString()
  },
  {
    _id: "book_010",
    title: "Neuromancer",
    author: "William Gibson",
    description: "The Matrix is a world within the world, a consensus hallucination, the representation of every byte of data in cyberspace. Case was the sharpest data-thief in the business, until he was targeted. This is the origin of the cyberpunk genre.",
    price: 16.99,
    category: "Sci-Fi & Fantasy",
    stock: 20,
    coverUrl: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&q=80&w=400",
    rating: 4.6,
    ratingCount: 1650,
    salesCount: 520,
    isTrending: true,
    aiSummary: "The seminal founding book for the Cyberpunk aesthetic. Inspects artificial intelligence systems, high-tech hacking, corporate dominance, and virtual transcendence.",
    createdAt: new Date("2026-04-18").toISOString()
  }
];

// Helper to interact with local JSON files as a fallback
class LocalCollection<T extends { _id?: string; userId?: string }> {
  private filePath: string;

  constructor(filename: string, private defaultData: T[] = []) {
    this.filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(this.filePath)) {
      this.write(defaultData);
    }
  }

  private read(): T[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.defaultData;
      }
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    } catch (e) {
      console.error(`Error reading database file ${this.filePath}:`, e);
      return this.defaultData;
    }
  }

  private write(data: T[]) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing database file ${this.filePath}:`, e);
    }
  }

  async find(query: Partial<T> = {}): Promise<T[]> {
    const list = this.read();
    return list.filter(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const list = this.read();
    const item = list.find(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return item || null;
  }

  async insertOne(doc: T): Promise<T> {
    const list = this.read();
    if (!doc._id) {
      doc._id = Math.random().toString(36).substr(2, 9);
    }
    list.push(doc);
    this.write(list);
    return doc;
  }

  async updateOne(query: Partial<T>, update: Partial<T>): Promise<{ modifiedCount: number }> {
    const list = this.read();
    let count = 0;
    const newList = list.map(item => {
      let matches = true;
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        count++;
        return { ...item, ...update };
      }
      return item;
    });
    this.write(newList);
    return { modifiedCount: count };
  }

  async deleteOne(query: Partial<T>): Promise<{ deletedCount: number }> {
    const list = this.read();
    let count = 0;
    const index = list.findIndex(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (index !== -1) {
      list.splice(index, 1);
      count = 1;
      this.write(list);
    }
    return { deletedCount: count };
  }

  async countDocuments(query: Partial<T> = {}): Promise<number> {
    const items = await this.find(query);
    return items.length;
  }
}

// Global DB Connection / Fallback Instance
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Initialize MongoDB Connection if MONGODB_URI is provided and valid
const mongoUri = process.env.MONGODB_URI;

export async function connectDb() {
  if (mongoUri) {
    try {
      console.log("Attempting to connect to MongoDB Atlas...");
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      mongoDb = mongoClient.db(process.env.MONGODB_DB_NAME || 'online_bookstore');
      console.log("Successfully connected to MongoDB Atlas!");

      // Pre-populate MongoDB if empty
      const mongoBooksColl = mongoDb.collection('books');
      const count = await mongoBooksColl.countDocuments();
      if (count === 0) {
        await mongoBooksColl.insertMany(DEFAULT_BOOKS as any);
        console.log("Seeded database with default premium books in Atlas!");
      }
    } catch (err) {
      console.error("MongoDB Atlas connection failed. Falling back to robust JSON DB:", err);
      mongoClient = null;
      mongoDb = null;
    }
  } else {
    console.log("No MONGODB_URI found. Initializing robust local JSON database...");
  }
}

// Fallback collections instance
const fileUsers = new LocalCollection<User>('users.json');
const fileBooks = new LocalCollection<Book>('books.json', DEFAULT_BOOKS);
const fileCarts = new LocalCollection<Cart>('carts.json');
const fileOrders = new LocalCollection<Order>('orders.json');
const fileWishlists = new LocalCollection<Wishlist>('wishlists.json');

// Database Collection API Adapter
export const db = {
  users: {
    find: async (query: Partial<User> = {}) => {
      if (mongoDb) return mongoDb.collection<User>('users').find(query).toArray();
      return fileUsers.find(query);
    },
    findOne: async (query: Partial<User>) => {
      if (mongoDb) return mongoDb.collection<User>('users').findOne(query);
      return fileUsers.findOne(query);
    },
    insertOne: async (user: User) => {
      if (mongoDb) {
        await mongoDb.collection<User>('users').insertOne(user);
        return user;
      }
      return fileUsers.insertOne(user);
    },
    updateOne: async (query: Partial<User>, update: Partial<User>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<User>('users').updateOne(query, { $set: update });
        return { modifiedCount: res.modifiedCount };
      }
      return fileUsers.updateOne(query, update);
    },
    deleteOne: async (query: Partial<User>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<User>('users').deleteOne(query);
        return { deletedCount: res.deletedCount };
      }
      return fileUsers.deleteOne(query);
    }
  },

  books: {
    find: async (query: any = {}) => {
      if (mongoDb) {
        // Convert any simple RegExp in mock query if present
        return mongoDb.collection<Book>('books').find(query).toArray();
      }
      return fileBooks.find(query);
    },
    findOne: async (query: Partial<Book>) => {
      if (mongoDb) return mongoDb.collection<Book>('books').findOne(query);
      return fileBooks.findOne(query);
    },
    insertOne: async (book: Book) => {
      if (mongoDb) {
        await mongoDb.collection<Book>('books').insertOne(book);
        return book;
      }
      return fileBooks.insertOne(book);
    },
    updateOne: async (query: Partial<Book>, update: Partial<Book>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Book>('books').updateOne(query, { $set: update });
        return { modifiedCount: res.modifiedCount };
      }
      return fileBooks.updateOne(query, update);
    },
    deleteOne: async (query: Partial<Book>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Book>('books').deleteOne(query);
        return { deletedCount: res.deletedCount };
      }
      return fileBooks.deleteOne(query);
    },
    countDocuments: async (query: Partial<Book> = {}) => {
      if (mongoDb) return mongoDb.collection<Book>('books').countDocuments(query);
      return fileBooks.countDocuments(query);
    }
  },

  carts: {
    findOne: async (query: Partial<Cart>) => {
      if (mongoDb) return mongoDb.collection<Cart>('carts').findOne(query);
      return fileCarts.findOne(query);
    },
    insertOne: async (cart: Cart) => {
      if (mongoDb) {
        await mongoDb.collection<Cart>('carts').insertOne(cart);
        return cart;
      }
      return fileCarts.insertOne(cart);
    },
    updateOne: async (query: Partial<Cart>, update: Partial<Cart>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Cart>('carts').updateOne(query, { $set: update });
        return { modifiedCount: res.modifiedCount };
      }
      return fileCarts.updateOne(query, update);
    },
    deleteOne: async (query: Partial<Cart>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Cart>('carts').deleteOne(query);
        return { deletedCount: res.deletedCount };
      }
      return fileCarts.deleteOne(query);
    }
  },

  orders: {
    find: async (query: Partial<Order> = {}) => {
      if (mongoDb) return mongoDb.collection<Order>('orders').find(query).toArray();
      return fileOrders.find(query);
    },
    findOne: async (query: Partial<Order>) => {
      if (mongoDb) return mongoDb.collection<Order>('orders').findOne(query);
      return fileOrders.findOne(query);
    },
    insertOne: async (order: Order) => {
      if (mongoDb) {
        await mongoDb.collection<Order>('orders').insertOne(order);
        return order;
      }
      return fileOrders.insertOne(order);
    },
    updateOne: async (query: Partial<Order>, update: Partial<Order>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Order>('orders').updateOne(query, { $set: update });
        return { modifiedCount: res.modifiedCount };
      }
      return fileOrders.updateOne(query, update);
    },
    deleteOne: async (query: Partial<Order>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Order>('orders').deleteOne(query);
        return { deletedCount: res.deletedCount };
      }
      return fileOrders.deleteOne(query);
    },
    countDocuments: async (query: Partial<Order> = {}) => {
      if (mongoDb) return mongoDb.collection<Order>('orders').countDocuments(query);
      return fileOrders.countDocuments(query);
    }
  },

  wishlists: {
    findOne: async (query: Partial<Wishlist>) => {
      if (mongoDb) return mongoDb.collection<Wishlist>('wishlists').findOne(query);
      return fileWishlists.findOne(query);
    },
    insertOne: async (wishlist: Wishlist) => {
      if (mongoDb) {
        await mongoDb.collection<Wishlist>('wishlists').insertOne(wishlist);
        return wishlist;
      }
      return fileWishlists.insertOne(wishlist);
    },
    updateOne: async (query: Partial<Wishlist>, update: Partial<Wishlist>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Wishlist>('wishlists').updateOne(query, { $set: update });
        return { modifiedCount: res.modifiedCount };
      }
      return fileWishlists.updateOne(query, update);
    },
    deleteOne: async (query: Partial<Wishlist>) => {
      if (mongoDb) {
        const res = await mongoDb.collection<Wishlist>('wishlists').deleteOne(query);
        return { deletedCount: res.deletedCount };
      }
      return fileWishlists.deleteOne(query);
    }
  }
};

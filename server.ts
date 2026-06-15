import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DbState {
  books: any[];
  products: any[];
  customers: any[];
  installments: any[];
  payments_log: any[];
  call_logs: any[];
  call_targets: any[];
}

// Initial Seed Data for Bangladesh Installment (কিস্তি) SaaS App "HR কিস্তি"
const state: DbState = {
  books: [
    { id: "b1", name: "এলইডি টিভি বই (LED TV)", created_by: "thosainju@gmail.com", created_at: new Date().toISOString() },
    { id: "b2", name: "রেফ্রিজারেটর বই (Freez)", created_by: "thosainju@gmail.com", created_at: new Date().toISOString() },
    { id: "b3", name: "মোবাইল কিস্তি বই (Mobile)", created_by: "thosainju@gmail.com", created_at: new Date().toISOString() }
  ],
  products: [
    { id: "p1", book_id: "b1", name: "Sony Bravia 32\" Smart LED", price_per_unit: 28000 },
    { id: "p2", book_id: "b1", name: "Singer 43\" 4K Android TV", price_per_unit: 42000 },
    { id: "p3", book_id: "b2", name: "Walton No-Frost 244L", price_per_unit: 34500 },
    { id: "p4", book_id: "b2", name: "Samsung Double Door 320L", price_per_unit: 49900 },
    { id: "p5", book_id: "b3", name: "Realme C55 (6/128 GB)", price_per_unit: 18500 },
    { id: "p6", book_id: "b3", name: "Redmi Note 12 Pro", price_per_unit: 26000 }
  ],
  customers: [
    {
      id: "c1",
      book_id: "b1",
      name: "মোঃ রফিকুল ইসলাম",
      address: "হাউস ১০, রোড ৪, মিরপুর-১১, ঢাকা",
      guarantor_name: "আব্দুর রহমান (চাচা)",
      memo_no: "M-9901",
      sale_date: "2026-05-10",
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "c2",
      book_id: "b1",
      name: "মোসাম্মৎ পারভীন আক্তার",
      address: "গ্রাম: রাজাপুর, সাভার, ঢাকা",
      guarantor_name: "মোঃ কামাল হোসেন (স্বামী)",
      memo_no: "M-9902",
      sale_date: "2026-06-01",
      created_at: new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "c3",
      book_id: "b2",
      name: "হাবিবুর রহমান",
      address: "মেইন রোড, বোর্ড বাজার, গাজীপুর",
      guarantor_name: "আলহাজ্ব ইউসুফ আলী (জমিদার)",
      memo_no: "M-8801",
      sale_date: "2026-04-15",
      created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "c4",
      book_id: "b3",
      name: "মোঃ শাকিল আহমেদ",
      address: "৫৪, ডি.আই.টি রোড, মালিবাগ, ঢাকা",
      guarantor_name: "ফারহানা শারমিন (বোন)",
      memo_no: "M-7701",
      sale_date: "2026-06-10",
      created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    }
  ],
  installments: [
    {
      id: "i1",
      customer_id: "c1",
      amount: 4000,
      date: "2026-06-10",
      memo_no: "INST-01",
      paid_to: "রাশেদুল (কালেক্টর)",
      notes: "১ম কিস্তি পরিশোধ সম্পন্ন",
      created_at: new Date().toISOString()
    },
    {
      id: "i2",
      customer_id: "c3",
      amount: 5000,
      date: "2026-05-15",
      memo_no: "INST-02",
      paid_to: "সোহেল রানা",
      notes: "১ম কিস্তি বাবদ জমা",
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "i3",
      customer_id: "c3",
      amount: 5000,
      date: "2026-06-12",
      memo_no: "INST-03",
      paid_to: "সোহেল রানা",
      notes: "২য় কিস্তি বাবদ জমা",
      created_at: new Date().toISOString()
    }
  ],
  payments_log: [
    {
      id: "pl1",
      customer_id: "c1",
      amount_type: "Cash Deposit",
      amount: 8000,
      date: "2026-05-10",
      notes: "ডাউন পেমেন্ট / নগদ জমা"
    },
    {
      id: "pl2",
      customer_id: "c2",
      amount_type: "Cash Deposit",
      amount: 10000,
      date: "2026-06-01",
      notes: "বুকিং মানি ও নগদ অগ্রিম"
    },
    {
      id: "pl3",
      customer_id: "c3",
      amount_type: "Cash Deposit",
      amount: 9500,
      date: "2026-04-15",
      notes: "প্রাথমিক নগদ ক্যাশ ডাউন পেমেন্ট"
    },
    {
      id: "pl4",
      customer_id: "c4",
      amount_type: "Cash Deposit",
      amount: 4500,
      date: "2026-06-10",
      notes: "নতুন মোবাইল বুকিং ডেক্স"
    }
  ],
  call_logs: [
    {
      id: "cl1",
      customer_id: "c3",
      called_by: "ম্যানেজার হাসিব",
      call_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      conversation_summary: "কিস্তি পরিশোধের তারিখ পার হয়ে গেছিল। কাস্টমার জানিয়েছেন আগামী ১২ তারিখের মধ্যে ২য় কিস্তি জমা দিবেন।",
      status: "Reached",
      next_action: "১২ তারিখ পর্যন্ত অপেক্ষা করুন ও আপডেট দেখুন"
    }
  ],
  call_targets: [
    {
      id: "ct1",
      customer_id: "c3",
      due_date: "2026-06-15",
      is_called: false,
      priority: "High"
    },
    {
      id: "ct2",
      customer_id: "c2",
      due_date: "2026-07-01",
      is_called: false,
      priority: "Medium"
    }
  ]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "in-memory-cloud" });
  });

  // BOOKS
  app.get("/api/books", (req, res) => {
    const { userEmail } = req.query;
    if (userEmail) {
      const emailStr = String(userEmail);
      if (emailStr === 'thosainju@gmail.com') {
        res.json(state.books.filter(b => b.created_by === emailStr || b.created_by === 'admin'));
      } else {
        res.json(state.books.filter(b => b.created_by === emailStr));
      }
    } else {
      res.json(state.books);
    }
  });
  app.post("/api/books", (req, res) => {
    const { name, created_by } = req.body;
    const newBook = {
      id: "b_" + Math.random().toString(36).substr(2, 9),
      name,
      created_by: created_by || "admin",
      created_at: new Date().toISOString()
    };
    state.books.push(newBook);
    res.status(201).json(newBook);
  });

  // PRODUCTS
  app.get("/api/products", (req, res) => {
    res.json(state.products);
  });
  app.post("/api/products", (req, res) => {
    const { book_id, name, price_per_unit } = req.body;
    const newProduct = {
      id: "p_" + Math.random().toString(36).substr(2, 9),
      book_id,
      name,
      price_per_unit: Number(price_per_unit) || 0
    };
    state.products.push(newProduct);
    res.status(201).json(newProduct);
  });

  // CUSTOMERS
  app.get("/api/customers", (req, res) => {
    res.json(state.customers);
  });
  app.post("/api/customers", (req, res) => {
    const { 
      book_id, 
      name, 
      address, 
      guarantor_name, 
      phone, 
      assigned_collector, 
      area, 
      installment_frequency, 
      total_installments, 
      memo_no, 
      sale_date, 
      product_id 
    } = req.body;
    const newId = "c_" + Math.random().toString(36).substr(2, 9);
    const newCustomer = {
      id: newId,
      book_id,
      name,
      address,
      guarantor_name,
      phone,
      assigned_collector,
      area,
      installment_frequency,
      total_installments: total_installments ? Number(total_installments) : undefined,
      memo_no,
      sale_date: sale_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    state.customers.push(newCustomer);

    // If client provided a dynamic purchase of service
    if (product_id) {
      // Just map if needed, or insert log
    }

    res.status(201).json(newCustomer);
  });

  // INSTALLMENTS
  app.get("/api/installments", (req, res) => {
    res.json(state.installments);
  });
  app.post("/api/installments", (req, res) => {
    const { customer_id, amount, date, memo_no, paid_to, notes } = req.body;
    const newInstallment = {
      id: "i_" + Math.random().toString(36).substr(2, 9),
      customer_id,
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      memo_no,
      paid_to,
      notes,
      created_at: new Date().toISOString()
    };
    state.installments.push(newInstallment);
    res.status(201).json(newInstallment);
  });

  // PAYMENTS LOG
  app.get("/api/payments_log", (req, res) => {
    res.json(state.payments_log);
  });
  app.post("/api/payments_log", (req, res) => {
    const { customer_id, amount_type, amount, date, notes } = req.body;
    const newLog = {
      id: "pl_" + Math.random().toString(36).substr(2, 9),
      customer_id,
      amount_type: amount_type || "Cash Deposit",
      amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      notes
    };
    state.payments_log.push(newLog);
    res.status(201).json(newLog);
  });

  // CALL LOGS
  app.get("/api/call_logs", (req, res) => {
    res.json(state.call_logs);
  });
  app.post("/api/call_logs", (req, res) => {
    const { customer_id, called_by, conversation_summary, status, next_action } = req.body;
    const newLog = {
      id: "cl_" + Math.random().toString(36).substr(2, 9),
      customer_id,
      called_by,
      call_date: new Date().toISOString(),
      conversation_summary,
      status, 
      next_action
    };
    state.call_logs.push(newLog);

    // If there is an active call target for this customer, mark it as called
    state.call_targets = state.call_targets.map(target => {
      if (target.customer_id === customer_id) {
        return { ...target, is_called: true };
      }
      return target;
    });

    res.status(201).json(newLog);
  });

  // CALL TARGETS
  app.get("/api/call_targets", (req, res) => {
    res.json(state.call_targets);
  });
  app.post("/api/call_targets", (req, res) => {
    const { customer_id, due_date, priority } = req.body;
    const newTarget = {
      id: "ct_" + Math.random().toString(36).substr(2, 9),
      customer_id,
      due_date: due_date || new Date().toISOString().split('T')[0],
      is_called: false,
      priority: priority || "Medium"
    };
    state.call_targets.push(newTarget);
    res.status(201).json(newTarget);
  });

  // UPDATE CALL TARGET STATUS
  app.put("/api/call_targets/:id", (req, res) => {
    const { id } = req.params;
    const { is_called, priority } = req.body;
    const targetIdx = state.call_targets.findIndex(t => t.id === id);
    if (targetIdx !== -1) {
      if (is_called !== undefined) state.call_targets[targetIdx].is_called = is_called;
      if (priority !== undefined) state.call_targets[targetIdx].priority = priority;
      res.json(state.call_targets[targetIdx]);
    } else {
      res.status(404).json({ error: "Target not found" });
    }
  });

  // EDIT / DELETE ENDPOINTS FOR LOCAL STATE
  // books
  app.put("/api/books/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const idx = state.books.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.books[idx].name = name;
      res.json(state.books[idx]);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  });
  app.delete("/api/books/:id", (req, res) => {
    state.books = state.books.filter(b => b.id !== req.params.id);
    res.json({ success: true });
  });

  // products
  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, price_per_unit } = req.body;
    const idx = state.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      if (name !== undefined) state.products[idx].name = name;
      if (price_per_unit !== undefined) state.products[idx].price_per_unit = Number(price_per_unit);
      res.json(state.products[idx]);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });
  app.delete("/api/products/:id", (req, res) => {
    state.products = state.products.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  // customers
  app.put("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const idx = state.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.customers[idx] = { ...state.customers[idx], ...updates };
      res.json(state.customers[idx]);
    } else {
      res.status(404).json({ error: "Customer not found" });
    }
  });
  app.delete("/api/customers/:id", (req, res) => {
    state.customers = state.customers.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // installments
  app.put("/api/installments/:id", (req, res) => {
    const { id } = req.params;
    const idx = state.installments.findIndex(i => i.id === id);
    if (idx !== -1) {
      state.installments[idx] = { ...state.installments[idx], ...req.body };
      res.json(state.installments[idx]);
    } else {
      res.status(404).json({ error: "Installment not found" });
    }
  });
  app.delete("/api/installments/:id", (req, res) => {
    state.installments = state.installments.filter(i => i.id !== req.params.id);
    res.json({ success: true });
  });

  // payments_log
  app.put("/api/payments_log/:id", (req, res) => {
    const { id } = req.params;
    const idx = state.payments_log.findIndex(p => p.id === id);
    if (idx !== -1) {
      state.payments_log[idx] = { ...state.payments_log[idx], ...req.body };
      res.json(state.payments_log[idx]);
    } else {
      res.status(404).json({ error: "Payment log not found" });
    }
  });
  app.delete("/api/payments_log/:id", (req, res) => {
    state.payments_log = state.payments_log.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  // AUTO GENERATE CALL TARGETS
  // Checks all customers that don't have a call target, and if they still owe money, generates one
  app.post("/api/generate-call-targets", (req, res) => {
    const generated: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    state.customers.forEach(customer => {
      // Only generate if there isn't a pending target already
      const existing = state.call_targets.find(t => t.customer_id === customer.id && !t.is_called);
      if (!existing) {
        // Get all installments for this customer
        const custInsts = state.installments.filter(i => i.customer_id === customer.id);
        let lastInstallmentDateStr = customer.sale_date;
        if (custInsts.length > 0) {
          custInsts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          lastInstallmentDateStr = custInsts[0].date;
        }

        // Installment frequency: Weekly (7 days) for mobile book or sale day <= 7, else Monthly (30 days)
        const book = state.books.find(b => b.id === customer.book_id);
        const bookName = book?.name?.toLowerCase() || '';
        const isMobileBook = bookName.includes('mobile') || bookName.includes('মোবাইল');
        const saleDay = new Date(customer.sale_date).getDate();

        const intervalDays = (isMobileBook || saleDay <= 7) ? 7 : 30;

        // Next installment due date
        const lastDate = new Date(lastInstallmentDateStr);
        const nextDueDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        const isDue = today > nextDueDate;

        if (isDue) {
          const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
          const newTarget = {
            id: "ct_" + Math.random().toString(36).substr(2, 9),
            customer_id: customer.id,
            due_date: nextDueDateStr,
            is_called: false,
            priority: "High"
          };
          state.call_targets.push(newTarget);
          generated.push(newTarget);
        }
      }
    });

    res.json({ message: "Auto call targets generated successfully", count: generated.length, items: generated });
  });

  // Serve static assets from build (or dev server middleware)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
